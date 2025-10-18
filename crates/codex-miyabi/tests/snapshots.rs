use assert_cmd::cargo::CommandCargoExt;
use insta::assert_json_snapshot;
use serde_json::Value;

fn run(cli_args: &[&str]) -> Value {
    let mut cmd = assert_cmd::Command::cargo_bin("codex-miyabi").unwrap();
    let output = cmd.args(cli_args).assert().get_output().stdout.clone();
    let s = String::from_utf8(output).unwrap();
    serde_json::from_str(&s).unwrap()
}

#[test]
fn snapshot_status_ok() {
    let v = run(&["status", "--json"]);
    assert_json_snapshot!(v, @r###"
    {
      "ok": true,
      "version": "1.0.0"
    }
    "###);
}

#[test]
fn snapshot_agent_run_not_implemented() {
    // Non-zero exit is expected; the CLI still outputs structured JSON to stdout
    let mut cmd = assert_cmd::Command::cargo_bin("codex-miyabi").unwrap();
    let out = cmd
        .args(["agent", "run", "--type", "coordinator", "--json"]).assert()
        .get_output()
        .stdout
        .clone();
    let s = String::from_utf8(out).unwrap();
    let v: Value = serde_json::from_str(&s).unwrap();
    assert_json_snapshot!(v, @r###"
    {
      "error": "not implemented: execute_agent is planned in Phase 1",
      "ok": false
    }
    "###);
}

#[test]
fn snapshot_worktree_list_redacted() {
    let mut v = run(&["worktree", "list", "--json"]);
    // v is an array; redact path
    if let Value::Array(items) = &mut v {
        for it in items.iter_mut() {
            if let Some(obj) = it.as_object_mut() {
                obj.insert("path".to_string(), Value::String("<REDACTED>".into()));
            }
        }
    }
    assert_json_snapshot!(v, @r###"
    [
      {
        "issue": 123,
        "name": "example-issue-123",
        "path": "<REDACTED>"
      }
    ]
    "###);
}

#[test]
fn snapshot_worktree_create_redacted() {
    let mut v = run(&["worktree", "create", "--issue", "270", "--json"]);
    if let Some(obj) = v.as_object_mut() {
        if let Some(wt) = obj.get_mut("worktree").and_then(|w| w.as_object_mut()) {
            wt.insert("path".to_string(), Value::String("<REDACTED>".into()));
        }
    }
    assert_json_snapshot!(v, @r###"
    {
      "issue": 270,
      "message": "created (mock)",
      "ok": true,
      "worktree": {
        "issue": 270,
        "name": "issue-270",
        "path": "<REDACTED>"
      }
    }
    "###);
}

#[test]
fn snapshot_worktree_cleanup() {
    let v = run(&["worktree", "cleanup", "--issue", "270", "--json"]);
    assert_json_snapshot!(v, @r###"
    {
      "issue": 270,
      "message": "cleanup scheduled (mock)",
      "ok": true,
      "worktree": null
    }
    "###);
}
