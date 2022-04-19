import { ButtonInteraction } from "discord.js";

abstract class ButtonInteractionHandle {
  public id: string;
  constructor(id: string) {
    this.id = id;
  }

  public async handle(interaction: ButtonInteraction) {
    // set interaction as handled
    setTimeout(async ()=> {
      try {
        await interaction.deferUpdate()
      } catch {}
    }, 2000);
  }
}

export {ButtonInteractionHandle}