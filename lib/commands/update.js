const { showInfo, showSuccess, showError, showWarning, getVersion } = require('../utils/command-helpers.js');
const { execSync } = require('child_process');

/**
 * Update command - check for and install REIS updates
 * @param {Object} args - {}
 */
module.exports = async function(args) {
  const currentVersion = getVersion();
  const packageName = '@gravirei/reis';
  
  console.log('');
  showInfo('🔍 Checking for REIS updates...');
  console.log('');
  showInfo(`   Current version: v${currentVersion}`);
  
  try {
    // Check latest version from npm
    const latestVersion = execSync(`npm view ${packageName} version 2>/dev/null`, { 
      encoding: 'utf-8' 
    }).trim();
    
    showInfo(`   Latest version:  v${latestVersion}`);
    console.log('');
    
    if (currentVersion === latestVersion) {
      showSuccess('✅ You are already on the latest version!');
      console.log('');
      return 0;
    }
    
    // New version available
    showWarning(`📦 New version available: v${currentVersion} → v${latestVersion}`);
    console.log('');
    showInfo('   Updating REIS...');
    console.log('');
    
    try {
      // Try global update
      execSync(`npm install -g ${packageName}@latest`, { 
        stdio: 'inherit',
        encoding: 'utf-8'
      });
      
      console.log('');
      showSuccess(`✅ Successfully updated to v${latestVersion}!`);
      console.log('');
      showInfo('   Run "reis whats-new" to see what\'s changed.');
      console.log('');
      
    } catch (installError) {
      // If global install fails, suggest manual update
      console.log('');
      showError('❌ Automatic update failed (may need sudo/admin privileges)');
      console.log('');
      showInfo('   Try manually:');
      showInfo(`   $ sudo npm install -g ${packageName}@latest`);
      showInfo('   or');
      showInfo(`   $ npm install -g ${packageName}@latest --force`);
      console.log('');
      return 1;
    }
    
  } catch (error) {
    showError('❌ Failed to check for updates');
    showInfo('   Check your internet connection and try again.');
    console.log('');
    showInfo('   Manual update:');
    showInfo(`   $ npm install -g ${packageName}@latest`);
    console.log('');
    return 1;
  }
  
  return 0;
};
