const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = (config) => {
  return withProjectBuildGradle(config, (config) => {
    // On remplace JCenter par MavenCentral pour éviter l'erreur masked-view
    config.modResults.contents = config.modResults.contents.replace(
      /jcenter\(\)/g,
      'mavenCentral()'
    );

    // On s'assure que la version de Kotlin est celle compatible avec votre Gradle 8.10.2
    config.modResults.contents = config.modResults.contents.replace(
      /kotlinVersion = .*/g,
      'kotlinVersion = "2.1.0"'
    );

    return config;
  });
};