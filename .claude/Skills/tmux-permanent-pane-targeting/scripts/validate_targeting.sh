#!/bin/bash
# validate_targeting.sh - Test pane targeting reliability
# Usage: ./validate_targeting.sh

echo "=== Tmux Pane Targeting Validation ==="
echo ""

errors=0
total=0

# Get all panes
while IFS=' ' read -r index_target pane_id; do
    ((total++))
    
    # Test 1: Permanent ID targeting
    result_perm=$(tmux display-message -t "$pane_id" -p "#{pane_id}" 2>/dev/null)
    
    # Test 2: Index-based targeting
    result_idx=$(tmux display-message -t "$index_target" -p "#{pane_id}" 2>/dev/null)
    
    if [ "$result_perm" = "$pane_id" ]; then
        perm_status="✅"
    else
        perm_status="❌"
        ((errors++))
    fi
    
    if [ "$result_idx" = "$pane_id" ]; then
        idx_status="✅"
    else
        idx_status="⚠️ MISMATCH"
        echo "  WARNING: $index_target points to $result_idx instead of $pane_id"
    fi
    
    echo "[$perm_status] Permanent: $pane_id | [$idx_status] Index: $index_target"
    
done < <(tmux list-panes -a -F "#{session_name}:#{window_index}.#{pane_index} #{pane_id}")

echo ""
echo "=== Summary ==="
echo "Total panes tested: $total"
echo "Permanent ID errors: $errors"
echo ""

if [ $errors -eq 0 ]; then
    echo "✅ All permanent IDs are reliable"
    exit 0
else
    echo "❌ Some permanent IDs failed"
    exit 1
fi
