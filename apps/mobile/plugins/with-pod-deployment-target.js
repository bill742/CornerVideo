// Xcode 27 fails any target whose deployment target is below iOS 15, and
// CocoaPods builds each pod for the minimum the pod declares — RevenueCat's
// declare iOS 13 — so the build breaks even though the app targets 15+.
// This adds RevenueCat's documented workaround to the generated Podfile: each
// pod below the app's deployment target is made to inherit the app's.
//
// https://www.revenuecat.com/docs/known-store-issues/xcode-27/cocoapods-deployment-target-error
//
// Expo SDK 57 applies an equivalent fix itself — remove this plugin (and its
// entry in app.json) when upgrading.

const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

const MARKER = "# corner-video: align pod deployment targets (Xcode 27)";

const HOOK = `
    ${MARKER}
    project_settings = installer.pods_project.build_configurations.first.build_settings
    %w[IPHONEOS_DEPLOYMENT_TARGET TVOS_DEPLOYMENT_TARGET WATCHOS_DEPLOYMENT_TARGET MACOSX_DEPLOYMENT_TARGET].each do |setting|
      app_minimum = project_settings[setting]
      next if app_minimum.nil?
      installer.pods_project.targets.each do |target|
        target.build_configurations.each do |config|
          pod_minimum = config.build_settings[setting]
          next if pod_minimum.nil? || Gem::Version.new(pod_minimum) >= Gem::Version.new(app_minimum)
          config.build_settings.delete(setting)
        end
      end
    end`;

// The react_native_post_install(...) call inside the template's single
// post_install block. RevenueCat's lines go straight after it.
const ANCHOR = /(\n[ \t]*react_native_post_install\([\s\S]*?\n[ \t]*\))/;

/** Returns the Podfile with the hook added; unchanged if already present. */
function addDeploymentTargetHook(podfile) {
  if (podfile.includes(MARKER)) return podfile;
  if (!ANCHOR.test(podfile)) {
    throw new Error(
      "with-pod-deployment-target: no react_native_post_install(...) call in the Podfile. The Expo template changed; update the plugin.",
    );
  }
  return podfile.replace(ANCHOR, `$1\n${HOOK}`);
}

function withPodDeploymentTarget(config) {
  return withDangerousMod(config, [
    "ios",
    (modConfig) => {
      const file = path.join(
        modConfig.modRequest.platformProjectRoot,
        "Podfile",
      );
      fs.writeFileSync(
        file,
        addDeploymentTargetHook(fs.readFileSync(file, "utf8")),
      );
      return modConfig;
    },
  ]);
}

module.exports = withPodDeploymentTarget;
module.exports.addDeploymentTargetHook = addDeploymentTargetHook;
