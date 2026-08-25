import { ProviderRegistry } from "./ProviderRegistry";
import { HealthChecker } from "./HealthChecker";
import { CapabilityManager } from "./CapabilityManager";
import { NoopProvider } from "./stubs/NoopProvider";
import type { Capability } from "../types/capability.types";
import type { IProvider } from "./interfaces/IProvider";
import { noProvider } from "../router/RouterErrors";

import { ClaudeProvider } from "./adapters/ClaudeProvider";
import { OpenAIProvider } from "./adapters/OpenAIProvider";
import { GroqProvider } from "./adapters/GroqProvider";
import { ReplitAgentProvider } from "./adapters/ReplitAgentProvider";
import { GeminiProvider } from "./adapters/GeminiProvider";
import { BoltNewProvider } from "./adapters/BoltNewProvider";
import { OpenAIImagesProvider } from "./adapters/OpenAIImagesProvider";
import { FluxProvider } from "./adapters/FluxProvider";
import { StableDiffusionProvider } from "./adapters/StableDiffusionProvider";
import { VeoProvider } from "./adapters/VeoProvider";
import { RunwayProvider } from "./adapters/RunwayProvider";
import { KlingAIProvider } from "./adapters/KlingAIProvider";
import { SunoProvider } from "./adapters/SunoProvider";
import { UdioProvider } from "./adapters/UdioProvider";
import { StableAudioProvider } from "./adapters/StableAudioProvider";
import { ElevenLabsProvider } from "./adapters/ElevenLabsProvider";
import { OpenAITTSProvider } from "./adapters/OpenAITTSProvider";
import { GoogleTTSProvider } from "./adapters/GoogleTTSProvider";
import { WhisperProvider } from "./adapters/WhisperProvider";
import { DeepgramProvider } from "./adapters/DeepgramProvider";
import { GoogleSpeechProvider } from "./adapters/GoogleSpeechProvider";
import { OpenAISearchProvider } from "./adapters/OpenAISearchProvider";
import { PerplexityProvider } from "./adapters/PerplexityProvider";
import { GoogleSearchProvider } from "./adapters/GoogleSearchProvider";
import { ReplitProvider } from "./adapters/ReplitProvider";
import { CodexProvider } from "./adapters/CodexProvider";

/**
 * Every concrete adapter is registered here, once. Nothing else in the
 * application ever imports an adapter class directly — features go through
 * TaskDispatcher -> ProviderManager -> (this registry) -> FallbackEngine,
 * so a provider can be added, removed, or replaced by editing only this
 * list plus routing.config.ts.
 */
const ADAPTER_CLASSES: Array<new () => IProvider> = [
  ClaudeProvider,
  OpenAIProvider,
  GroqProvider,
  ReplitAgentProvider,
  GeminiProvider,
  BoltNewProvider,
  OpenAIImagesProvider,
  FluxProvider,
  StableDiffusionProvider,
  VeoProvider,
  RunwayProvider,
  KlingAIProvider,
  SunoProvider,
  UdioProvider,
  StableAudioProvider,
  ElevenLabsProvider,
  OpenAITTSProvider,
  GoogleTTSProvider,
  WhisperProvider,
  DeepgramProvider,
  GoogleSpeechProvider,
  OpenAISearchProvider,
  PerplexityProvider,
  GoogleSearchProvider,
  ReplitProvider,
  CodexProvider,
];

export class ProviderManager {
  readonly registry = new ProviderRegistry();
  readonly health: HealthChecker;
  readonly capabilities: CapabilityManager;

  constructor() {
    for (const Adapter of ADAPTER_CLASSES) {
      this.registry.register(new Adapter());
    }
    // Always registered last — the universal safety net so every capability
    // resolves to at least one provider even if none of the real ones are
    // configured yet (e.g. a fresh environment with no API keys set).
    this.registry.register(new NoopProvider());
    this.health = new HealthChecker(this.registry);
    this.capabilities = new CapabilityManager(this.registry);
  }

  resolve(capability: Capability): IProvider {
    const list = this.registry.findByCapability(capability);
    if (list.length === 0) throw noProvider(capability);
    return list[0];
  }

  resolveAll(capability: Capability): IProvider[] {
    return this.registry.findByCapability(capability);
  }
}
