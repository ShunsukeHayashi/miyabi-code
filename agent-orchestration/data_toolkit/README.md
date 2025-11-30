# data_toolkit

Lightweight utilities for loading data, performing simple analysis, and generating structured plot specifications without third-party dependencies.

## Modules
- `loader.py`: `DataLoader` with `load_csv`, `load_json`, `validate`, `transform`, `save`.
- `analyzer.py`: `Analyzer` with `mean`, `median`, `correlation`, `regression`, `summary`.
- `plotter.py`: `Plotter` with `line_plot`, `scatter`, `histogram`, `boxplot`, `heatmap`.
- `utils.py`: helpers such as `ensure_numeric`, `flatten`, `chunk`, `moving_average`, `normalize`.

## Quickstart
```python
from data_toolkit import DataLoader, Analyzer, Plotter

loader = DataLoader()
rows = loader.load_csv("input.csv")
ok, errors = loader.validate(rows, required_fields=["a", "b"])
if not ok:
    raise ValueError(errors)

analyzer = Analyzer()
summary = analyzer.summary([1, 2, 3, 4])

plotter = Plotter()
spec = plotter.scatter([1, 2, 3], [4, 5, 6])
```

## Tests
Run `pytest data_toolkit/tests` to execute the 15 sample tests that exercise loaders, analyzers, and plotting specs.
