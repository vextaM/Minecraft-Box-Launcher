import { InstanceSave } from "../../universal/store/InstanceSave";
import * as consoleUtils from "../../universal/consoleUtils";
import { ApplicationStore } from "../../universal/store";
import { Installer } from "@xmcl/installer";
import { remote, ipcRenderer } from "electron";
import { LaunchController } from './LaunchController';

function menuItem(version: Installer.VersionMeta) {
	return `<div class="item" data-value="${version.id}">
	<div class="text" style="display:inline-block">${version.id}</div>
	<div class="description">${version.releaseTime}</div>
	</div>`;
}

function updateIdDropdown(val?: string) {
	$("#dropdown-id .menu").empty();
	$("#dropdown-id").dropdown("set text", "Select Version");
	// check if version is selected
	if (val !== undefined) {
		// remove disable on #dropdown-id
		$(".ui.dropdown#dropdown-id").removeClass("disabled");
		// find list of instances
		const versions = ApplicationStore.versionsMetaCache.get("versions") as Installer.VersionMeta[];
		// append to dropdown
		switch (val) {
			case "vanilla-release":
				for (const version of versions) {
					if (version.type == "release") {
						// render versions
						$("#dropdown-id .menu").append(menuItem(version));
					}
				}
				break;
			case "vanilla-snapshot":
				for (const version of versions) {
					if (version.type == "snapshot") {
						// render versions
						$("#dropdown-id .menu").append(menuItem(version));
					}
				}
				break;
			case "vanilla-historical":
				for (const version of versions) {
					if (version.type == "old_alpha" || version.type == "old_beta") {
						// render versions
						$("#dropdown-id .menu").append(menuItem(version));
					}
				}
				break;
			case "forge":
				break;
		}
	}
	else
		$(".ui.dropdown#dropdown-id").addClass("disabled");
}

$(() => {
	// setup dropdowns
	$(".ui.dropdown#dropdown-type").dropdown({
		onChange: updateIdDropdown
	});
	$(".ui.dropdown#dropdown-id").dropdown();
	
	if ($.fn.form.settings.rules !== undefined) {
		$.fn.form.settings.rules.doesNotExist = function (param): boolean {
			// Your validation condition goes here
			const find = ApplicationStore.instances.findFromName(param);
			console.log(find)
			return param.length !== 0 && find === undefined;
		}
	}

	// setup form
	$("#form-newInstance").form({
		inline: true,
		fields: {
			name: {
				identifier: "instance-name",
				rules: [{
					type: "doesNotExist",
					prompt: ((value: string) => {
						if (value.length === 0) return "Please enter a name for this instance";
						else return "An instance with this name already exists"; // can only be invalid if not blank
					}) as unknown as string // FIXME: This is a bug with semantic-ui typings where validating programmatically is not working
				}]
			},
			type: {
				identifier: "instance-type",
				rules: [{
					type: "empty",
					prompt: "Please select a type for the instance"
				}]
			},
			id: { // minecraft version
				identifier: "instance-id",
				rules: [{
					type: "empty",
					prompt: "Please select a version for the instance"
				}]
			}
		}
	});

	// setup submit event
	$("#form-newInstance").submit((event: JQuery.SubmitEvent) => {
		event.preventDefault();
		const form = $("#form-newInstance");
		// validate form
		form.form("validate form");
		if (form.form("is valid")) {
			// create instance from form values
			let tempVersionMeta = ApplicationStore.versionsMetaCache.get("versions")
				.find((obj: Installer.VersionMeta) => {
					return obj.id == form.form("get value", "instance-id");
				});
			let tempInstance = new InstanceSave(
				form.form("get value", "instance-name"),
				tempVersionMeta
			);
			console.log(tempInstance);
			// create a new instance in InstanceStore
			ApplicationStore.instances.addInstance(tempInstance);
			// tell main window to update
			ipcRenderer.sendSync("new-instance");
			// close window
			remote.getCurrentWindow().close();
		}
	});
});