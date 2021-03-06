import { Authentication, login as uLogin, refresh, validate, invalidate } from "@xmcl/user";

import AuthStore from "../store/AuthStore";
import type { AuthModal } from "../components/AuthModal";

export namespace AuthenticationController {
	/**
	 * Sends a request Yggdrasil auth server and stores the returned data
	 * @param username Minecraft email
	 * @param password Minecraft password
	 */
	export async function login(username: string, password: string): Promise<Authentication> {
		const authFromMojang: Authentication = await uLogin({ username, password }); // official login
		// save data to electron store
		AuthStore.set({ ...authFromMojang, loggedIn: true });

		// show toast message
		// @ts-ignore
		$("body").toast({
			title: "Success",
			message: `Logged in as ${authFromMojang.selectedProfile.name}`,
			showImage: `https://minotar.net/avatar/${authFromMojang.selectedProfile.id}`
		});
		return authFromMojang;
	}
	/**
	 * Logouts user and resets store
	 */
	export async function logout(): Promise<void> {
		const authData = AuthStore.store;
		if (authData.loggedIn) {
			// invalidate tokens
			const accessToken: string = authData.accessToken;
			const clientToken: string = authData.clientToken;
			console.log("Invalidating access/client pair.");
			await invalidate({ accessToken, clientToken });

			// clear store
			AuthStore.set("loggedIn", false);
		}
		return;
	}
	/**
	 * Verifies that login is still valid. This function should be called on app startup
	 * @throws if user is not logged in
	 */
	export async function refreshLogin(): Promise<void> {
		if (!AuthStore.store.loggedIn) {
			throw new Error("User is not logged in. Cannot refresh auth.");
		}
		else {
			const authData = AuthStore.store;
			const accessToken: string = authData.accessToken;
			const clientToken: string = authData.clientToken;


			const valid: boolean = await validate({ accessToken, clientToken });
			if (!valid) {
				try {
					const newAuth = await refresh({ accessToken, clientToken });

					console.log("Refreshing auth. New auth value: ", newAuth);
					// save new auth to store
					AuthStore.set({ ...newAuth, loggedIn: true });
				}
				catch (err) {
					// user needs to login again
					if (err != "TypeError: Failed to fetch") { // not offline
						console.error(err);
						logout();
						await import("../components/AuthModal");
						document.querySelector<AuthModal>("#modal-login")!.showModal();
					}
				}
			}
		}
	}
}
