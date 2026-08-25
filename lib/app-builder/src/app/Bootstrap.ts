import { container, token } from "../core/di/Container";
import { EventBus, globalBus } from "../core/events/EventBus";
import { Logger, logger } from "../core/logger/Logger";
import { AppBuilderConfig, defaultConfig } from "./Config";

export const T_BUS = token<EventBus>("EventBus");
export const T_LOGGER = token<Logger>("Logger");
export const T_CONFIG = token<AppBuilderConfig>("AppBuilderConfig");

let booted = false;
export function bootstrapAppBuilder(cfg: Partial<AppBuilderConfig> = {}): void {
  if (booted) return;
  container.register(T_BUS, globalBus);
  container.register(T_LOGGER, logger);
  container.register(T_CONFIG, { ...defaultConfig, ...cfg });
  booted = true;
  logger.info("App Builder bootstrapped");
}
