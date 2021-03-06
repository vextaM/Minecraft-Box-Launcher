/* istanbul ignore file */
import { shell } from "electron";

export function showErrorToast(message: string): void {
	// show toast with error message
	// @ts-ignore
	$("body").toast({
		class: "error",
		message: `<strong>An unexpected error occured</strong>:<br>${message}`,
		displayTime: 0,
		classActions: "top attached",
		actions: [{
			text: "Report issue",
			class: "yellow",
			click: (): void => {
				shell.openExternal("https://github.com/lukechu10/Minecraft-Box-Launcher/issues/new/choose");
			}
		}, {
			text: "Ignore",
			class: "orange"
		}]
	});
}
