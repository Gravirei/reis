#!/bin/bash

# Comprehensive Command Testing Script for REIS
# Tests all 29 commands across 4 categories

echo "========================================"
echo "REIS Command Testing Suite"
echo "========================================"
echo ""

PASSED=0
FAILED=0
ERRORS_FILE="tmp_rovodev_test_errors.log"
> "$ERRORS_FILE"

# Helper function to test a command
test_command() {
    local cmd_name="$1"
    local cmd_args="$2"
    local expect_error="${3:-false}"
    
    echo -n "Testing: reis $cmd_name $cmd_args ... "
    
    if node bin/reis.js $cmd_name $cmd_args > /tmp/test_output.txt 2>&1; then
        if [ "$expect_error" = "true" ]; then
            echo "❌ FAILED (expected error but succeeded)"
            echo "reis $cmd_name $cmd_args - Expected error but succeeded" >> "$ERRORS_FILE"
            FAILED=$((FAILED + 1))
        else
            echo "✓ PASSED"
            PASSED=$((PASSED + 1))
        fi
    else
        if [ "$expect_error" = "true" ]; then
            echo "✓ PASSED (error as expected)"
            PASSED=$((PASSED + 1))
        else
            echo "❌ FAILED"
            cat /tmp/test_output.txt >> "$ERRORS_FILE"
            echo "---" >> "$ERRORS_FILE"
            FAILED=$((FAILED + 1))
        fi
    fi
}

echo "========================================"
echo "1. CORE COMMANDS (6 commands)"
echo "========================================"

test_command "help" ""
test_command "version" ""
test_command "new" '"Test Project Idea"'
test_command "map" ""
test_command "requirements" ""
test_command "roadmap" ""

echo ""
echo "========================================"
echo "2. PHASE MANAGEMENT COMMANDS (7 commands)"
echo "========================================"

test_command "plan" "1"
test_command "discuss" "1"
test_command "research" "1"
test_command "assumptions" "1"
test_command "execute" "1"
test_command "execute-plan" ".planning/phases/01-package-infrastructure/01-01-package-setup.PLAN.md"
test_command "verify" "1"

echo ""
echo "========================================"
echo "3. PROGRESS & ROADMAP COMMANDS (6 commands)"
echo "========================================"

test_command "progress" ""
test_command "pause" ""
test_command "resume" ""
test_command "add" '"New Feature"'
test_command "insert" '2 "Inserted Phase"'
test_command "remove" "100"

echo ""
echo "========================================"
echo "4. MILESTONE COMMANDS (3 commands)"
echo "========================================"

test_command "milestone" "discuss"
test_command "milestone" 'new "Test Milestone"'
test_command "milestone" 'complete "M1"'

echo ""
echo "========================================"
echo "5. TODO COMMANDS (3 commands)"
echo "========================================"

test_command "todo" '"Fix authentication bug"'
test_command "todos" ""
test_command "todos" "auth"

echo ""
echo "========================================"
echo "6. UTILITY COMMANDS (4 commands)"
echo "========================================"

test_command "debug" '"Issue with database connection"'
test_command "docs" ""
test_command "whats-new" ""
test_command "update" ""

echo ""
echo "========================================"
echo "TESTING ERROR HANDLING"
echo "========================================"

# Test commands with missing arguments (should fail gracefully)
test_command "plan" "" "true"
test_command "add" "" "true"
test_command "insert" "" "true"
test_command "remove" "" "true"
test_command "todo" "" "true"

echo ""
echo "========================================"
echo "SUMMARY"
echo "========================================"
echo "Total Passed: $PASSED"
echo "Total Failed: $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "⚠️  Some tests failed. Check $ERRORS_FILE for details."
    exit 1
else
    echo "✓ All tests passed!"
    rm -f "$ERRORS_FILE"
    exit 0
fi
