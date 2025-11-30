import pytest

from data_toolkit.plotter import Plotter


def test_line_plot_returns_points():
    plotter = Plotter()
    result = plotter.line_plot([0, 1], [1, 2], label="trend")
    assert result["type"] == "line"
    assert result["label"] == "trend"
    assert result["points"] == [(0, 1), (1, 2)]


def test_scatter_validates_lengths():
    plotter = Plotter()
    with pytest.raises(ValueError):
        plotter.scatter([1, 2], [1])

    result = plotter.scatter([1, 2], [3, 4])
    assert result["type"] == "scatter"
    assert len(result["points"]) == 2


def test_histogram_counts_match():
    plotter = Plotter()
    data = [1, 2, 3, 4, 5]
    result = plotter.histogram(data, bins=4)
    assert result["type"] == "histogram"
    total = sum(bin_info["count"] for bin_info in result["bins"])
    assert total == len(data)


def test_boxplot_quartiles():
    plotter = Plotter()
    data = [1, 2, 3, 4, 5]
    result = plotter.boxplot(data)
    assert result["median"] == 3
    assert result["q1"] == 1.5
    assert result["q3"] == 4.5
    assert result["min"] == 1
    assert result["max"] == 5


def test_heatmap_validates_matrix():
    plotter = Plotter()
    matrix = [[1, 2], [3, 4]]
    result = plotter.heatmap(matrix)
    assert result["rows"] == 2
    assert result["cols"] == 2
    assert result["values"] == matrix

    with pytest.raises(ValueError):
        plotter.heatmap([[1, 2], [3]])
