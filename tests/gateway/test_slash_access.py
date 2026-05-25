"""Tests for gateway.slash_access — slash command access control policy."""
import pytest
from unittest.mock import MagicMock

from gateway.slash_access import (
    SlashAccessPolicy,
    _coerce_id_list,
    _coerce_command_list,
    _scope_for_chat_type,
    _platform_extra,
    _keys_for_scope,
    policy_from_extra,
    policy_for_source,
    _ALWAYS_ALLOWED_FOR_USERS,
)


class TestCoerceIdList:
    """Unit tests for _coerce_id_list normalizer."""

    def test_none_returns_empty(self):
        assert _coerce_id_list(None) == frozenset()

    def test_list_of_strings(self):
        assert _coerce_id_list(["u1", "u2"]) == frozenset({"u1", "u2"})

    def test_tuple_of_ints(self):
        assert _coerce_id_list((42, 99)) == frozenset({"42", "99"})

    def test_comma_string(self):
        assert _coerce_id_list("a, b, c") == frozenset({"a", "b", "c"})

    def test_single_scalar(self):
        assert _coerce_id_list(123) == frozenset({"123"})

    def test_strips_whitespace(self):
        assert _coerce_id_list(["  spaced  ", " normal "]) == frozenset({"spaced", "normal"})


class TestCoerceCommandList:
    """Unit tests for _coerce_command_list normalizer."""

    def test_none_returns_empty(self):
        assert _coerce_command_list(None) == frozenset()

    def test_list_lowercases(self):
        assert _coerce_command_list(["Help", "STATUS"]) == frozenset({"help", "status"})

    def test_strips_leading_slash(self):
        assert _coerce_command_list(["/help", "/status"]) == frozenset({"help", "status"})

    def test_comma_string(self):
        assert _coerce_command_list("help, /status, WHOAMI") == frozenset({"help", "status", "whoami"})


class TestScopeForChatType:
    def test_dm_variants(self):
        for ct in ("dm", "direct", "private", ""):
            assert _scope_for_chat_type(ct) == "dm"

    def test_group(self):
        assert _scope_for_chat_type("group") == "group"

    def test_none(self):
        assert _scope_for_chat_type(None) == "group"


class TestPlatformExtra:
    def test_none(self):
        assert _platform_extra(None) == {}

    def test_object_with_extra(self):
        class C:
            extra = {"a": 1}
        assert _platform_extra(C()) == {"a": 1}

    def test_dict_passes_through(self):
        assert _platform_extra({"a": 1}) == {"a": 1}

    def test_no_extra_attribute(self):
        assert _platform_extra(object()) == {}


class TestKeysForScope:
    def test_dm_keys(self):
        assert _keys_for_scope("dm") == ("allow_admin_from", "user_allowed_commands")

    def test_group_keys(self):
        assert _keys_for_scope("group") == ("group_allow_admin_from", "group_user_allowed_commands")


class TestPolicyFromExtra:
    """Unit tests for policy_from_extra."""

    def test_disabled_when_no_admin(self):
        policy = policy_from_extra({}, "dm")
        assert policy.enabled is False
        assert policy.is_admin("anyone") is True  # disabled → everyone is admin
        assert policy.can_run("anyone", "help") is True

    def test_enabled_with_admin(self):
        policy = policy_from_extra({"allow_admin_from": ["admin1"]}, "dm")
        assert policy.enabled is True
        assert policy.is_admin("admin1") is True
        assert policy.is_admin("nobody") is False

    def test_dm_falls_back_to_group_commands(self):
        extra = {"group_user_allowed_commands": ["status"], "allow_admin_from": ["admin1"]}
        policy = policy_from_extra(extra, "dm")
        assert policy.can_run("nobody", "status") is True

    def test_dm_disabled_when_no_dm_admin(self):
        # When no DM admin list is set the policy is disabled entirely
        extra = {"group_allow_admin_from": ["admin1"]}
        policy = policy_from_extra(extra, "dm")
        assert policy.enabled is False
        assert policy.is_admin("admin1") is True  # disabled → bypass

    def test_command_list_parsing(self):
        extra = {"allow_admin_from": "u1", "user_allowed_commands": ["/help", "status"]}
        policy = policy_from_extra(extra, "dm")
        assert policy.can_run("u1", "help") is True  # admin gets everything
        assert policy.can_run("u2", "help") is True  # always-allowed
        assert policy.can_run("u2", "status") is True  # listed for users
        assert policy.can_run("u2", "restart") is False  # not listed


class TestSlashAccessPolicy:
    """Unit tests for SlashAccessPolicy."""

    def test_always_allowed(self):
        # Non-admin user with empty allowlist — still gets _ALWAYS_ALLOWED
        policy = SlashAccessPolicy(
            enabled=True,
            admin_user_ids=frozenset({"admin"}),
            user_allowed_commands=frozenset(),
        )
        for cmd in _ALWAYS_ALLOWED_FOR_USERS:
            assert policy.can_run("nobody", cmd) is True

    def test_admin_can_run_anything(self):
        policy = SlashAccessPolicy(
            enabled=True,
            admin_user_ids=frozenset({"admin"}),
            user_allowed_commands=frozenset({"help"}),
        )
        assert policy.can_run("admin", "anything") is True

    def test_user_blocked_for_unlisted(self):
        policy = SlashAccessPolicy(
            enabled=True,
            admin_user_ids=frozenset({"admin"}),
            user_allowed_commands=frozenset({"help"}),
        )
        assert policy.can_run("user", "restart") is False

    def test_user_allowed_for_listed(self):
        policy = SlashAccessPolicy(
            enabled=True,
            admin_user_ids=frozenset({"admin"}),
            user_allowed_commands=frozenset({"restart", "status"}),
        )
        assert policy.can_run("user", "restart") is True
        assert policy.can_run("user", "status") is True
        assert policy.can_run("user", "help") is True  # always-allowed


class TestPolicyForSource:
    """Integration-style tests for policy_for_source."""

    def test_none_config_returns_disabled(self):
        from gateway.slash_access import policy_for_source
        src = MagicMock()
        src.platform = "discord"
        src.chat_type = "dm"
        policy = policy_for_source(None, src)
        assert policy.enabled is False

    def test_gateway_without_platform(self):
        cfg = MagicMock()
        cfg.platforms = None
        src = MagicMock()
        src.platform = "discord"
        src.chat_type = "dm"
        policy = policy_for_source(cfg, src)
        assert policy.enabled is False

    def test_platform_with_admin_set(self):
        class FakeCfg(dict):
            platforms = {"discord": MagicMock(extra={"allow_admin_from": ["u1"]})}
        src = MagicMock()
        src.platform = "discord"
        src.chat_type = "dm"
        policy = policy_for_source(FakeCfg(), src)
        assert policy.enabled is True
        assert policy.is_admin("u1") is True

    def test_unknown_platform_returns_disabled(self):
        class FakeCfg(dict):
            platforms = {"telegram": MagicMock()}
        src = MagicMock()
        src.platform = "discord"
        src.chat_type = "dm"
        policy = policy_for_source(FakeCfg(), src)
        assert policy.enabled is False
