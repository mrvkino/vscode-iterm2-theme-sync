import * as vscode from 'vscode';
import { getColorTheme } from './vscode/getColorTheme';
import {
  vscodeColorThemeToItermProfile,
  updateDynamicProfile,
} from './iterm2/index';
import { ConfigurationTarget } from 'vscode';

export const EXT_ID: string = "iterm2-theme-sync.parentProfile";

async function createProfileWithVSCodeTheme(context: vscode.ExtensionContext, parentProfile: string) {
  try {
    const vscodeColorTheme = await getColorTheme(context);
    const itermProfile = vscodeColorThemeToItermProfile(vscodeColorTheme, parentProfile);

    await updateDynamicProfile(itermProfile);

    return itermProfile;
  } catch (error) {
    vscode.window.showErrorMessage(`[iTerm2 Theme Sync] An unknown error has occurred :( You can create an issue in the github repository and I will try to fix it as soon as possible. Error message: ${error.message}`);
  }
}

function showFirstActivationNotification(profileName: string) {
  const text = [
    'The extension «iTerm2 Theme Sync» was successfully installed!',
    `Now you can open iTerm2 preferences and make the profile called «${profileName}» default.
    After restart, iTerm will be synchronized with the selected VSCode theme.`,
  ];

  return vscode.window.showInformationMessage(text.join('\n'), 'Ok');
}

async function checkFirstActivation(context: vscode.ExtensionContext) {
  const wasActivated = false;//context.globalState.get<boolean>('wasActivated');

  if (!wasActivated) {
    const options: vscode.InputBoxOptions = {
      ignoreFocusOut: true,
      placeHolder: "Default",
      prompt:
        'Enter the name of the profile to use as the parent profile.',
      value: "Default",
    };
    const parentProfile = (await vscode.window.showInputBox(options)) || '';
    const config = vscode.workspace.getConfiguration();
    config.update(EXT_ID.concat("parentProfile"), parentProfile, ConfigurationTarget.Global);
    const profile = await createProfileWithVSCodeTheme(context, parentProfile);

    if (!profile) {
      return;
    }

    if (profile.Name) {
      showFirstActivationNotification(profile.Name);
    }

    await context.globalState.update('wasActivated', true);
  }
}

export function activate(context: vscode.ExtensionContext) {
  checkFirstActivation(context);

  vscode.window.onDidChangeActiveColorTheme(async (event) => {
    // START HERE: add configuration read iterm2-theme-sync.parentProfile = "default"
    // add also the config write in workspace in the check first activation
    const config = vscode.workspace.getConfiguration(EXT_ID);
    const parentProfile = config.get("parentProfile") as string;
    createProfileWithVSCodeTheme(context, parentProfile);
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
