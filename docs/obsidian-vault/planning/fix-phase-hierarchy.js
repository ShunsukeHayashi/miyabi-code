// Fix Phase task hierarchy - they should not be EPICs themselves
const fs = require('fs');
const hierarchy = JSON.parse(fs.readFileSync('task-hierarchy.json', 'utf8'));

// Phase tasks that are incorrectly marked as EPICs
const phaseTasksToFix = [984, 985, 986, 987, 983, 982, 981, 980, 979, 978];

phaseTasksToFix.forEach(id => {
  if (hierarchy[id]) {
    console.log(`Removing EPIC status from #${id}: ${hierarchy[id].title}`);
    delete hierarchy[id];
  }
});

fs.writeFileSync('task-hierarchy.json', JSON.stringify(hierarchy, null, 2));
console.log(`✅ Fixed hierarchy`);

// Re-run master DB creation
console.log('Re-generating master database...');
require('./create-master-db.js');
