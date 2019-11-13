import InstanceSave from "../instance/InstanceSave";
import * as consoleUtils from "../consoleUtils";
import { versionsMetaCache, instances } from "../store";
import { Installer } from "@xmcl/installer";
import { Version } from "@xmcl/common";
import { remote, ipcRenderer } from "electron";

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
		const versions = versionsMetaCache.get("versions") as Installer.VersionMeta[];
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

	// setup form
	$("#new-instance-form").form({
		inline: true,
		fields: {
			name: {
				identifier: "instance-name",
				rules: [{
					type: "empty",
					prompt: "Please enter a name for the instance"
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
	$("#new-instance-form").submit((event: JQuery.SubmitEvent) => {
		event.preventDefault();
		const form = $("#new-instance-form");
		consoleUtils.debug("Submit button clicked, adding instance with following values:");
		// validate form
		$("#new-instance-form").form("validate form");
		if ($("new-instance-form").form("is valid")) {
			// create instance from form values
			let tempVersionMeta = versionsMetaCache.get("versions")
				.find((obj: Installer.VersionMeta) => {
					return obj.id == form.form("get value", "instance-id");
				});
			let tempInstance = new InstanceSave(
				form.form("get value", "instance-name"),
				tempVersionMeta
			);
			console.log(tempInstance);
			// create a new instance in InstanceStore
			instances.addInstance(tempInstance);
			// tell main window to update
			ipcRenderer.sendSync("new-instance");
			// close window
			remote.getCurrentWindow().close();
		}
	});
});