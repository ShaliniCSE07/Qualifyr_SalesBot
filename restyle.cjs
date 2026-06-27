const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/App.tsx',
  'src/components/ChatWindow.tsx',
  'src/components/BantDashboard.tsx',
  'src/components/ShortlistDisplay.tsx',
  'src/components/DocumentQAWindow.tsx'
];

const replacements = [
  [/bg-slate-50\/50/g, 'bg-bg-primary/50'],
  [/bg-slate-50/g, 'bg-bg-primary'],
  [/bg-slate-100/g, 'bg-bg-primary'],
  [/bg-white/g, 'bg-bg-surface'],
  [/bg-slate-200\/60/g, 'bg-bg-elevated'],
  [/bg-slate-200/g, 'bg-bg-elevated'],
  [/text-slate-950/g, 'text-text-primary'],
  [/text-slate-900/g, 'text-text-primary'],
  [/text-slate-800/g, 'text-text-primary'],
  [/text-slate-700/g, 'text-text-primary'],
  [/text-slate-600/g, 'text-text-secondary'],
  [/text-slate-500/g, 'text-text-secondary'],
  [/text-slate-400/g, 'text-text-muted'],
  [/border-slate-100\/50/g, 'border-border-subtle'],
  [/border-slate-100/g, 'border-border-subtle'],
  [/border-slate-200\/60/g, 'border-border-subtle'],
  [/border-slate-200\/80/g, 'border-border-subtle'],
  [/border-slate-200/g, 'border-border-subtle'],
  [/ring-indigo-500\/20/g, 'ring-accent/20'],
  [/ring-indigo-500/g, 'ring-accent'],
  [/bg-indigo-600/g, 'bg-accent text-[#14171C]'],
  [/hover:bg-indigo-700/g, 'hover:bg-accent-hover'],
  [/text-indigo-600/g, 'text-accent'],
  [/text-indigo-700/g, 'text-accent'],
  [/hover:text-indigo-600/g, 'hover:text-accent-hover'],
  [/hover:text-indigo-700/g, 'hover:text-accent-hover'],
  [/border-indigo-600/g, 'border-accent'],
  [/border-indigo-200/g, 'border-accent/30'],
  [/border-indigo-100/g, 'border-accent/20'],
  [/bg-indigo-50/g, 'bg-bg-elevated'],
  
  // Emerald / Teal mappings
  [/bg-gradient-to-br from-emerald-600 to-teal-700/g, 'bg-bg-elevated border border-border-subtle'],
  [/text-emerald-700/g, 'text-success'],
  [/text-emerald-600/g, 'text-success'],
  [/text-emerald-800/g, 'text-success font-bold'],
  [/text-emerald-900/g, 'text-success font-bold'],
  [/border-emerald-200\/60/g, 'border-border-subtle'],
  [/border-emerald-200/g, 'border-border-subtle'],
  [/border-emerald-100/g, 'border-border-subtle'],
  [/bg-emerald-50\/50/g, 'bg-bg-elevated'],
  [/bg-emerald-50/g, 'bg-bg-elevated'],
  [/bg-emerald-600/g, 'bg-accent'],
  [/hover:bg-emerald-700/g, 'hover:bg-accent-hover'],
  [/ring-emerald-500\/20/g, 'ring-accent/20'],
  [/ring-emerald-500/g, 'ring-accent'],
  
  // Warning mappings
  [/bg-amber-50\/50/g, 'bg-bg-elevated'],
  [/border-amber-100/g, 'border-warning/30'],
  [/text-amber-700/g, 'text-warning'],
  [/text-amber-800/g, 'text-warning'],
  
  // Shapes
  [/rounded-2xl/g, 'rounded-lg'],
  [/rounded-xl/g, 'rounded-lg'],
  
  // Focus outlines
  [/focus:ring-1/g, 'focus:ring-2 focus:outline-none focus:ring-accent'],
  [/focus:ring-2/g, 'focus:ring-2 focus:outline-none focus:ring-accent'],
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(([regex, replacement]) => {
      content = content.replace(regex, replacement);
    });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
