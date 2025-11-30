"""Setup configuration."""
from setuptools import setup, find_packages

setup(
    name="webapp-framework",
    version="1.0.0",
    author="Miyabi Project",
    description="Lightweight Python web framework",
    long_description=open("docs/README.md").read(),
    long_description_content_type="text/markdown",
    packages=find_packages(),
    install_requires=[],
    python_requires=">=3.9",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)
