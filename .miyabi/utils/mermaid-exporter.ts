/**
 * Account Plan → Mermaid.js Visualization Exporter
 * 
 * Converts AccountPlan JSON to Mermaid diagram code for:
 * - Organization Tree
 * - Approach Sequence
 * - Relationship Map
 */

import type { AccountPlan, Keyperson, Department } from '../types/account-plan.types';

// ==========================================
// Organization Tree (Mindmap)
// ==========================================

export function generateOrgTreeMermaid(plan: AccountPlan): string {
  const lines: string[] = [
    'mindmap',
    `  root((${plan.company.name}))`
  ];
  
  // Group keypersons by department
  const deptMap = new Map<string, Keyperson[]>();
  
  plan.keypersons?.forEach(kp => {
    const dept = kp.department || 'その他';
    if (!deptMap.has(dept)) {
      deptMap.set(dept, []);
    }
    deptMap.get(dept)!.push(kp);
  });
  
  // Add departments and people
  deptMap.forEach((people, deptName) => {
    lines.push(`    ${deptName}`);
    people.forEach(person => {
      const roleIcon = getRoleIcon(person.role_type);
      const priority = person.bdr_context?.priority || '-';
      lines.push(`      ${roleIcon} ${person.name}`);
      lines.push(`        ${person.title}`);
      if (person.bdr_context) {
        lines.push(`        P${priority} | ${person.bdr_context.recommended_channel}`);
      }
    });
  });
  
  return lines.join('\n');
}

function getRoleIcon(role?: string): string {
  switch (role) {
    case 'decision_maker': return '👑';
    case 'influencer': return '💡';
    case 'user': return '👤';
    case 'blocker': return '🚫';
    default: return '○';
  }
}

// ==========================================
// Approach Sequence Diagram
// ==========================================

export function generateApproachSequenceMermaid(plan: AccountPlan): string {
  const lines: string[] = [
    'sequenceDiagram',
    '  autonumber',
    '  participant BDR as 🎯 BDR',
  ];
  
  // Add participants (keypersons)
  const targetPeople = plan.keypersons?.filter(kp => kp.bdr_context) || [];
  targetPeople.forEach(kp => {
    const roleIcon = getRoleIcon(kp.role_type);
    lines.push(`  participant ${sanitizeId(kp.name)} as ${roleIcon} ${kp.name}`);
  });
  
  // Add sequence from recommended_approach
  plan.recommended_approach?.sequence?.forEach(step => {
    const targetId = sanitizeId(step.target);
    const channelNote = getChannelEmoji(step.channel);
    
    lines.push(`  BDR->>+${targetId}: ${channelNote} ${step.action}`);
    lines.push(`  Note right of ${targetId}: ${step.timing}`);
    lines.push(`  ${targetId}-->>-BDR: Response`);
  });
  
  return lines.join('\n');
}

function sanitizeId(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, '');
}

function getChannelEmoji(channel: string): string {
  switch (channel) {
    case 'linkedin': return '💼';
    case 'email': return '📧';
    case 'event': return '🎤';
    case 'referral': return '🤝';
    case 'cold_call': return '📞';
    case 'zoom': return '💻';
    default: return '📨';
  }
}

// ==========================================
// Relationship Map (Flowchart)
// ==========================================

export function generateRelationshipMapMermaid(plan: AccountPlan): string {
  const lines: string[] = [
    'flowchart TB',
    `  subgraph company["🏢 ${plan.company.name}"]`
  ];
  
  // Add pain points
  if (plan.company.pain_points?.length) {
    lines.push('    subgraph pains["❗ Pain Points"]');
    plan.company.pain_points.forEach((pain, i) => {
      lines.push(`      pain${i}["${pain.category}"]`);
    });
    lines.push('    end');
  }
  
  // Add departments
  plan.departments?.forEach((dept, i) => {
    lines.push(`    dept${i}["📁 ${dept.name}"]`);
    if (dept.parent) {
      const parentIdx = plan.departments?.findIndex(d => d.name === dept.parent);
      if (parentIdx !== undefined && parentIdx >= 0) {
        lines.push(`    dept${parentIdx} --> dept${i}`);
      }
    }
  });
  
  lines.push('  end');
  
  // Add product solution
  lines.push('');
  lines.push(`  product["📦 ${plan.recommended_approach?.key_messages?.[0] || 'Your Product'}"]`);
  
  // Connect pain points to product
  plan.company.pain_points?.forEach((_, i) => {
    lines.push(`  pain${i} -.->|solves| product`);
  });
  
  // Add keypersons and their approach
  lines.push('');
  lines.push('  subgraph targets["🎯 Target Contacts"]');
  plan.keypersons?.filter(kp => kp.bdr_context).forEach((kp, i) => {
    const icon = getRoleIcon(kp.role_type);
    lines.push(`    kp${i}["${icon} ${kp.name}<br/>${kp.title}"]`);
  });
  lines.push('  end');
  
  // Connect keypersons to departments
  plan.keypersons?.forEach((kp, i) => {
    const deptIdx = plan.departments?.findIndex(d => d.name === kp.department);
    if (deptIdx !== undefined && deptIdx >= 0) {
      lines.push(`  kp${i} --- dept${deptIdx}`);
    }
  });
  
  // Style
  lines.push('');
  lines.push('  classDef painStyle fill:#ffcccc,stroke:#ff0000');
  lines.push('  classDef productStyle fill:#ccffcc,stroke:#00aa00');
  lines.push('  class pain0,pain1,pain2 painStyle');
  lines.push('  class product productStyle');
  
  return lines.join('\n');
}

// ==========================================
// Full Export
// ==========================================

export interface MermaidExport {
  org_tree: string;
  approach_sequence: string;
  relationship_map: string;
}

export function exportToMermaid(plan: AccountPlan): MermaidExport {
  return {
    org_tree: generateOrgTreeMermaid(plan),
    approach_sequence: generateApproachSequenceMermaid(plan),
    relationship_map: generateRelationshipMapMermaid(plan)
  };
}

// ==========================================
// HTML Preview Generator
// ==========================================

export function generateMermaidPreviewHTML(plan: AccountPlan): string {
  const exports = exportToMermaid(plan);
  
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>Account Plan: ${plan.company.name}</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #f5f5f5; }
    .diagram-container { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1, h2 { color: #333; }
    .mermaid { text-align: center; }
  </style>
</head>
<body>
  <h1>🎯 ${plan.company.name} - Account Plan</h1>
  <p>Generated: ${plan.metadata?.generated_at || new Date().toISOString()}</p>
  
  <div class="diagram-container">
    <h2>📊 Organization Tree</h2>
    <pre class="mermaid">
${exports.org_tree}
    </pre>
  </div>
  
  <div class="diagram-container">
    <h2>📈 Approach Sequence</h2>
    <pre class="mermaid">
${exports.approach_sequence}
    </pre>
  </div>
  
  <div class="diagram-container">
    <h2>🗺️ Relationship Map</h2>
    <pre class="mermaid">
${exports.relationship_map}
    </pre>
  </div>
  
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
</body>
</html>`;
}
