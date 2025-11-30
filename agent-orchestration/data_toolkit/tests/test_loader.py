import csv
import json

from data_toolkit.loader import DataLoader


def test_load_csv_reads_rows(tmp_path):
    path = tmp_path / "sample.csv"
    path.write_text("a,b\n1,2\n3,4\n", encoding="utf-8")

    loader = DataLoader()
    data = loader.load_csv(path)

    assert len(data) == 2
    assert data[0]["a"] == "1"
    assert data[1]["b"] == "4"


def test_load_json_reads_data(tmp_path):
    payload = {"numbers": [1, 2, 3]}
    path = tmp_path / "sample.json"
    path.write_text(json.dumps(payload), encoding="utf-8")

    loader = DataLoader()
    data = loader.load_json(path)

    assert data == payload


def test_validate_detects_missing_fields():
    loader = DataLoader()
    valid = [{"a": 1, "b": 2}]
    invalid = [{"a": 1}, {"b": 2}]

    ok, errors = loader.validate(valid, required_fields=["a", "b"])
    assert ok is True
    assert errors == []

    ok, errors = loader.validate(invalid, required_fields=["a", "b"])
    assert ok is False
    assert len(errors) == 2


def test_transform_applies_function():
    loader = DataLoader()
    data = [{"value": 1}, {"value": 2}]

    result = loader.transform(data, lambda row: row["value"] * 2)

    assert result == [2, 4]


def test_save_json_and_csv(tmp_path):
    loader = DataLoader()
    rows = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]

    json_path = tmp_path / "out.json"
    loader.save(rows, json_path)
    saved_json = json.loads(json_path.read_text(encoding="utf-8"))
    assert saved_json == rows

    csv_path = tmp_path / "out.csv"
    loader.save(rows, csv_path)
    with csv_path.open(newline="", encoding="utf-8") as handle:
        reader = list(csv.DictReader(handle))
    assert len(reader) == 2
    assert reader[0]["a"] == "1"
