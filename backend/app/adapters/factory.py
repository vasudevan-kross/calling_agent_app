from app.adapters.base import VoiceProviderAdapter
from app.adapters.vapi_adapter import VapiAdapter
from app.adapters.retell_adapter import RetellAdapter
from app.config import settings


class VoiceProviderFactory:
    """Factory for creating voice provider adapters

    This factory determines which voice provider adapter to use
    based on the ACTIVE_VOICE_PROVIDER configuration setting.
    """

    @staticmethod
    def get_provider() -> VoiceProviderAdapter:
        """Get the currently configured voice provider adapter

        Returns:
            VoiceProviderAdapter instance (VapiAdapter or RetellAdapter)

        Raises:
            ValueError: If provider is not configured or unknown
        """
        provider_name = settings.active_voice_provider.lower()

        if provider_name == "vapi":
            return VapiAdapter()
        elif provider_name == "retell":
            return RetellAdapter()
        else:
            raise ValueError(
                f"Unknown voice provider: {provider_name}. "
                f"Supported providers: 'vapi', 'retell'"
            )

    @staticmethod
    def get_specific_provider(provider_name: str) -> VoiceProviderAdapter:
        """Get a specific provider regardless of configuration

        Useful for testing or processing webhooks from a specific provider

        Args:
            provider_name: Name of provider ('vapi' or 'retell')

        Returns:
            VoiceProviderAdapter instance

        Raises:
            ValueError: If provider name is unknown
        """
        provider_name = provider_name.lower()

        if provider_name == "vapi":
            return VapiAdapter()
        elif provider_name == "retell":
            return RetellAdapter()
        else:
            raise ValueError(f"Unknown voice provider: {provider_name}")
