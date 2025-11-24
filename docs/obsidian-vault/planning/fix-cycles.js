// Fix circular dependencies (self-references)
const fs = require('fs');
const hierarchy = JSON.parse(fs.readFileSync('task-hierarchy.json', 'utf8'));

let fixedCount = 0;

Object.keys(hierarchy).forEach(epicId => {
  const id = parseInt(epicId);
  const children = hierarchy[epicId].children;

  // Remove self-reference
  const filtered = children.filter(childId => childId !== id);

  if (filtered.length !== children.length) {
    console.log(`Fixing #${epicId}: removed self-reference`);
    hierarchy[epicId].children = filtered;
    fixedCount++;
  }
});

fs.writeFileSync('task-hierarchy.json', JSON.stringify(hierarchy, null, 2));
console.log(`✅ Fixed ${fixedCount} self-references`);

// Re-run create-master-db to update
console.log('Re-generating master database...');
require('./create-master-db.js');
