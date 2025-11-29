"""
AWS Secrets Manager integration for Lambda functions

This module provides utilities to fetch secrets from AWS Secrets Manager
and integrate them with the application configuration.
"""

import os
import json
import boto3
from typing import Dict, Any, Optional
from functools import lru_cache


class SecretsManager:
    """AWS Secrets Manager client wrapper"""

    def __init__(self, region: str = None):
        """
        Initialize Secrets Manager client

        Args:
            region: AWS region (defaults to AWS_REGION env var or us-west-2)
        """
        self.region = region or os.getenv("AWS_REGION", "us-west-2")
        self.client = boto3.client("secretsmanager", region_name=self.region)

    @lru_cache(maxsize=10)
    def get_secret(self, secret_name: str) -> Dict[str, Any]:
        """
        Retrieve a secret from AWS Secrets Manager

        Args:
            secret_name: Name or ARN of the secret

        Returns:
            Dict containing the secret values

        Raises:
            Exception: If secret retrieval fails
        """
        try:
            response = self.client.get_secret_value(SecretId=secret_name)

            # Parse the secret string as JSON
            if "SecretString" in response:
                return json.loads(response["SecretString"])
            else:
                raise ValueError(f"Secret {secret_name} does not contain SecretString")

        except Exception as e:
            raise Exception(f"Failed to retrieve secret {secret_name}: {str(e)}")

    def get_secret_value(self, secret_name: str, key: str, default: Any = None) -> Any:
        """
        Get a specific value from a secret

        Args:
            secret_name: Name or ARN of the secret
            key: Key within the secret JSON
            default: Default value if key not found

        Returns:
            The secret value or default
        """
        try:
            secret = self.get_secret(secret_name)
            return secret.get(key, default)
        except Exception as e:
            print(f"Warning: Failed to get secret value {key} from {secret_name}: {e}")
            return default


def load_secrets_to_env(
    project_name: str = "miyabi",
    environment: str = "prod",
    region: str = None
) -> None:
    """
    Load secrets from AWS Secrets Manager into environment variables

    This function fetches all secrets and merges them into os.environ.
    It should be called early in the application startup.

    Args:
        project_name: Project name (default: miyabi)
        environment: Environment name (default: prod)
        region: AWS region (default: from AWS_REGION env var)
    """
    # Skip if running locally without AWS credentials
    if not os.getenv("AWS_EXECUTION_ENV"):
        print("Not running in AWS Lambda, skipping Secrets Manager")
        return

    manager = SecretsManager(region=region)

    try:
        # Load API keys secret
        api_keys_secret = f"{project_name}/{environment}/api-keys"
        api_keys = manager.get_secret(api_keys_secret)

        # Load project config secret
        config_secret = f"{project_name}/{environment}/config"
        config = manager.get_secret(config_secret)

        # Merge into environment variables (don't override existing)
        for key, value in {**api_keys, **config}.items():
            if key not in os.environ:
                os.environ[key] = str(value)

        print(f"Successfully loaded secrets from {api_keys_secret} and {config_secret}")

    except Exception as e:
        print(f"Warning: Failed to load secrets: {e}")
        print("Continuing with environment variables only")


def get_secret(secret_name: str, key: Optional[str] = None, default: Any = None) -> Any:
    """
    Convenience function to get a secret value

    Args:
        secret_name: Name or ARN of the secret
        key: Optional key within the secret (if None, returns entire secret)
        default: Default value if not found

    Returns:
        Secret value or default

    Example:
        >>> github_token = get_secret("miyabi/prod/api-keys", "GITHUB_TOKEN")
        >>> all_keys = get_secret("miyabi/prod/api-keys")
    """
    manager = SecretsManager()

    if key:
        return manager.get_secret_value(secret_name, key, default)
    else:
        try:
            return manager.get_secret(secret_name)
        except Exception as e:
            print(f"Warning: Failed to get secret {secret_name}: {e}")
            return default


# Auto-load secrets when module is imported (Lambda only)
if os.getenv("AWS_EXECUTION_ENV"):
    load_secrets_to_env()
