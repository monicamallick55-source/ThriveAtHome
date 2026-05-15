#!/bin/bash

# =============================================================
# Thrive@Home — Infinite Agentic Build Loop
# For Claude Code CLI on Mac, Linux, or GitHub Codespaces
#
# Usage:
#   chmod +x build.sh
#   ./build.sh
#
# What this does:
#   Runs Claude Code in a loop. Claude reads the build files,
#   works on the current phase, and writes its status to
#   progress.md. This script reads that status after each run
#   and either pauses for your input or immediately relaunches.
#
# Stop the loop:   Ctrl+C
# =============================================================

PROMPT="You are the autonomous build agent for Thrive@Home.

Read these files in this exact order before doing anything else:
1. prompt.md
2. progress.md
3. checklist.md

Then follow the agentic loop protocol defined in prompt.md Section 1 exactly as written.

Key rules:
- Never begin a new phase without APPROVED written in progress.md by the human
- Never mark a checklist item [x] without running its specific verification
- Never make more than one change at a time when debugging
- After 3 failed hypotheses on any item: write BLOCKED to progress.md and stop

When you finish your work for this session, write one of these exact status markers
as the last line of your progress.md entry:

  AWAITING HUMAN APPROVAL   — phase complete, you presented the review, waiting
  QUESTION FOR HUMAN        — you need information before you can continue
  Status: BLOCKED           — stuck after 3 hypotheses, human must intervene
  Session ended normally    — mid-phase work done, will resume next session

Begin with your session opening statement."

LOG_FILE="claude-build.log"

# Colours
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
RED='\033[0;31m'
GREEN='\033[0;32m'
RESET='\033[0m'

echo ""
echo -e "${CYAN}=== Thrive@Home Agentic Build Loop ===${RESET}"
echo -e "${CYAN}Log file: $LOG_FILE${RESET}"
echo -e "${CYAN}Stop with Ctrl+C at any time${RESET}"
echo ""

# Verify required files exist
for f in prompt.md progress.md checklist.md tests.md human_review.md; do
    if [ ! -f "$f" ]; then
        echo -e "${RED}ERROR: $f not found in current directory.${RESET}"
        echo "Make sure you are in the thrive-at-home project directory and all 5 build files are present."
        echo "Run: ls prompt.md progress.md checklist.md tests.md human_review.md"
        exit 1
    fi
done

# Verify claude is installed
if ! command -v claude &> /dev/null; then
    echo -e "${RED}ERROR: claude command not found.${RESET}"
    echo "Install with: npm install -g @anthropic-ai/claude-code"
    echo "Then authenticate with: claude login"
    exit 1
fi

SESSION=0

while true; do
    SESSION=$((SESSION + 1))
    echo ""
    echo -e "${CYAN}=== STARTING CLAUDE SESSION $SESSION ===${RESET}"
    echo -e "${CYAN}$(date)${RESET}"
    echo ""

    # Run Claude Code — pipe output to terminal AND log file simultaneously
    echo "$PROMPT" | claude --print 2>&1 | tee -a "$LOG_FILE"

    echo ""
    echo -e "${CYAN}=== SESSION $SESSION ENDED ===${RESET}"

    # Read the last 50 lines of progress.md to detect status
    PROGRESS=$(tail -50 progress.md 2>/dev/null || echo "")

    # ── Human approval required ───────────────────────────────────────────
    if echo "$PROGRESS" | grep -q "AWAITING HUMAN APPROVAL"; then
        echo ""
        echo -e "${YELLOW}╔══════════════════════════════════════════════════════════╗${RESET}"
        echo -e "${YELLOW}║         PHASE COMPLETE — YOUR REVIEW IS REQUIRED         ║${RESET}"
        echo -e "${YELLOW}╚══════════════════════════════════════════════════════════╝${RESET}"
        echo ""
        echo -e "${YELLOW}1. Read progress.md to see what was built this session${RESET}"
        echo -e "${YELLOW}2. Open human_review.md and work through the checklist for this phase${RESET}"
        echo -e "${YELLOW}3. Open progress.md and add one of these lines at the bottom:${RESET}"
        echo ""
        echo -e "   ${GREEN}APPROVED${RESET}                   → Claude will begin the next phase"
        echo -e "   ${RED}ISSUE: [your description]${RESET}  → Claude will fix and re-present"
        echo ""
        echo -e "${YELLOW}4. Press Enter when you have updated progress.md${RESET}"
        echo ""
        read -p "Press Enter to resume the loop... "

    # ── Claude has a question ─────────────────────────────────────────────
    elif echo "$PROGRESS" | grep -q "QUESTION FOR HUMAN"; then
        echo ""
        echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════╗${RESET}"
        echo -e "${MAGENTA}║              CLAUDE HAS A QUESTION FOR YOU               ║${RESET}"
        echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════╝${RESET}"
        echo ""
        echo -e "${MAGENTA}Read progress.md to see the question.${RESET}"
        echo -e "${MAGENTA}Add your answer at the bottom of progress.md, then press Enter.${RESET}"
        echo ""
        read -p "Press Enter when you have answered in progress.md... "

    # ── Blocked after 3 hypotheses ────────────────────────────────────────
    elif echo "$PROGRESS" | grep -q "Status: BLOCKED"; then
        echo ""
        echo -e "${RED}╔══════════════════════════════════════════════════════════╗${RESET}"
        echo -e "${RED}║                    CLAUDE IS BLOCKED                     ║${RESET}"
        echo -e "${RED}╚══════════════════════════════════════════════════════════╝${RESET}"
        echo ""
        echo -e "${RED}Claude tried 3 different approaches and could not resolve the problem.${RESET}"
        echo ""
        echo -e "${RED}1. Read progress.md — it shows exactly what was tried (H1, H2, H3)${RESET}"
        echo -e "${RED}2. Look at the specific file, URL, or Supabase table mentioned${RESET}"
        echo -e "${RED}3. Add your guidance or the missing information at the bottom of progress.md${RESET}"
        echo -e "${RED}4. Press Enter and Claude will try again with your input${RESET}"
        echo ""
        read -p "Press Enter when you have added guidance to progress.md... "

    # ── Session ended normally — auto-resume ──────────────────────────────
    else
        echo ""
        echo -e "${GREEN}Session ended normally — resuming in 3 seconds${RESET}"
        echo -e "${GREEN}(Ctrl+C to stop the loop)${RESET}"
        sleep 3
    fi

done
