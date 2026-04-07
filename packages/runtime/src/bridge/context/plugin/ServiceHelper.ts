

import { Game, IGamePluginRegistry, LiveGameEventToken, Story } from "narraleaf-react";
import { ContextActionsService } from "../ContextActions";

const name = "narralang:service-helper";

export function createServiceHelperPlugin(story: Story, contextActionService: ContextActionsService): IGamePluginRegistry {
    let listenerToken: LiveGameEventToken;

    return {
        name,
        register: (game: Game) => {
            listenerToken = game.hooks.hook("init", () => {
                story.registerService(name, contextActionService);
            });
        },
        unregister: (_game: Game) => {
            listenerToken.cancel();
        }
    };
};
