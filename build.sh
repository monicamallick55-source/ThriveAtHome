#!/bin/bash

# =============================================================
# Thrive@Home — Infinite Agentic Build Loop
# For Claude Code CLI on Mac, Linux, or GitHub Codespaces
#
# HOW TO RUN:
#   chmod +x build.sh   (already done)
#   ./build.sh
#
# HOW IT WORKS:
#   Each iteration pipes the build prompt to `claude -p`, which
#   runs Claude non-interactively with full tool access. Claude
#   reads the build files, does its work, writes its status to
#   the last line of progress.md, then exits. This script reads
#   that status line and either pauses for your input or
#   immediately starts the next session.
#
# YOUR ONLY ACTIONS:
#   - When paused for approval: open progress.md, add APPROVED
#     or ISSUE: [description] at the bottom, press Enter
#   - When paused for a question: add your answer at the bottom
#     of progress.md, press Enter
#   - When BLOCKED: add guidance at the bottom of progress.md,
#     press Enter
#   - To stop at any time: Ctrl+C
#
# WHAT CLAUDE CAN DO IN EACH SESSION:
#   Read files, write files, run bash commands, edit code.
#   It cannot browse the internet or open a browser.
#   It WILL modify your project files — that is the point.
# =============================================================

# ── Colours ──────────────────────────────────────────────────
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
RED='\033[0;31m'
GREEN='\033[0;32m'
BOLD='\033[1m'
RESET='\033[0m'

LOG_FILE="claude-build.log"

# ── The prompt Claude receives at the start of every session ─
# Kept short intentionally — the detail is in prompt.md.
# Claude reads the files; the prompt just tells it what to do.
PROMPT="You are the autonomous build agent for Thrive@Home. You have full permission to read files, write files, create files, and run bash commands. Do not ask for permission. Do not pause to ask questions. Just build.

Read these files immediately, in this exact order, before doing anything else:
1. prompt-ui.md     — UI polish instructions for this session
2. prompt.md        — the agentic loop protocol (Section 1 still applies)
3. progress.md      — where the build is right now and where to resume
4. checklist.md     — current state of every checklist item

Then act immediately based on what you find:
- If progress.md shows no sessions started: check node --version, then begin Phase 1 right now
- If progress.md shows STATUS: AWAITING_APPROVAL: say which phase and wait for APPROVED
- If progress.md shows a NEXT SESSION MUST entry: resume from exactly that point
- If all 14 phases are APPROVED_COMPLETE: say so and stop

Do not ask about Vercel, Supabase, or any other prerequisite. The build files contain all instructions. If a phase requires a credential that is not yet set, note it in progress.md and move to what you CAN build right now.

Rules every session:
- Never begin a new phase without APPROVED in progress.md from the human
- Never mark [x] without running its specific verification
- One hypothesis at a time when debugging — max 3 then write BLOCKED
- You have full file and bash permissions — use them, do not ask for them

End every session by writing one of these as the last line of your progress.md entry:

  AWAITING HUMAN APPROVAL   — phase complete, review presented
  QUESTION FOR HUMAN        — genuinely need info that is not in the build files
  Status: BLOCKED           — 3 hypotheses failed
  Session ended normally    — mid-phase, will auto-resume

Begin immediately. No preamble."

# ── Startup checks ────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}╔═══════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║     Thrive@Home — Agentic Build Loop              ║${RESET}"
echo -e "${BOLD}${CYAN}║     Claude Code CLI — Infinite Loop Mode          ║${RESET}"
echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "Log: ${CYAN}$LOG_FILE${RESET}   Stop: ${CYAN}Ctrl+C${RESET}"
echo ""

# Check all 5 build files exist
MISSING=0
for f in prompt.md progress.md checklist.md tests.md human_review.md; do
    if [ ! -f "$f" ]; then
        echo -e "${RED}✗ Missing: $f${RESET}"
        MISSING=1
    else
        echo -e "${GREEN}✓ Found: $f${RESET}"
    fi
done

if [ $MISSING -eq 1 ]; then
    echo ""
    echo -e "${RED}One or more build files are missing.${RESET}"
    echo "Make sure you are in the thrive-at-home project directory."
    echo "Expected files: prompt.md  progress.md  checklist.md  tests.md  human_review.md"
    exit 1
fi

# Check claude is installed
if ! command -v claude &> /dev/null; then
    echo ""
    echo -e "${RED}✗ 'claude' command not found.${RESET}"
    echo ""
    echo "Install Claude Code CLI:"
    echo "  npm install -g @anthropic-ai/claude-code"
    echo ""
    echo "Then authenticate:"
    echo "  claude login"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ claude found: $(claude --version 2>/dev/null | head -1)${RESET}"
echo ""
echo -e "${CYAN}Starting loop in 2 seconds...${RESET}"
sleep 2

# ── Main loop ─────────────────────────────────────────────────
# Logic: STOP is the default. The loop only auto-continues on one
# specific signal ("Session ended normally") from Claude. Every
# other outcome — approval needed, question, blocked, limit hit,
# unexpected output — stops and waits for you.
SESSION=0

while true; do
    SESSION=$((SESSION + 1))
    echo ""
    echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo -e "${BOLD}${CYAN}  SESSION $SESSION  —  $(date '+%Y-%m-%d %H:%M:%S')${RESET}"
    echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo ""

    # Run Claude non-interactively. Output goes to terminal AND log file.
    echo "$PROMPT" | claude -p \
        --dangerously-skip-permissions \
        --allowedTools "Write,Edit,MultiEdit,Bash,Read,Glob,Grep,LS" \
        2>&1 | tee -a "$LOG_FILE"

    EXIT_CODE=${PIPESTATUS[0]}

    echo ""
    echo -e "${CYAN}── Session $SESSION ended ──${RESET}"

    # Read the last 60 lines of progress.md and last 20 lines of log
    PROGRESS_TAIL=$(tail -60 progress.md 2>/dev/null || echo "")
    LOG_TAIL=$(tail -20 "$LOG_FILE" 2>/dev/null || echo "")

    # ── THE ONLY CASE THAT AUTO-CONTINUES ──────────────────────────────────
    # Claude wrote "Session ended normally" AND exit code was 0.
    # This means it finished mid-phase work and is ready for the next session.
    if echo "$PROGRESS_TAIL" | grep -qi "Session ended normally" && [ $EXIT_CODE -eq 0 ]; then
        echo ""
        echo -e "${GREEN}  Mid-phase work saved. Resuming in 5 seconds...${RESET}"
        echo -e "${GREEN}  (Ctrl+C to pause)${RESET}"
        sleep 5
        continue
    fi

    # ── EVERYTHING ELSE STOPS AND WAITS ────────────────────────────────────

    # ── Usage/rate limit hit ─────────────────────────────────────
    # Catches exit code 0 AND exit code non-0 — the limit message
    # can appear in either case depending on Claude Code version.
    if echo "$LOG_TAIL" | grep -qi "hit your limit\|rate limit\|usage limit\|resets\|overloaded\|quota exceeded"; then
        # Extract reset time if Claude printed it
        RESET_TIME=$(echo "$LOG_TAIL" | grep -i "resets" | grep -oE "[0-9]+:[0-9]+(am|pm|AM|PM)( \(UTC\))?" | head -1)
        echo ""
        echo -e "${BOLD}${YELLOW}╔══════════════════════════════════════════════════╗${RESET}"
        echo -e "${BOLD}${YELLOW}║            USAGE LIMIT REACHED — STOPPED         ║${RESET}"
        echo -e "${BOLD}${YELLOW}╚══════════════════════════════════════════════════╝${RESET}"
        echo ""
        if [ -n "$RESET_TIME" ]; then
            echo -e "${YELLOW}  Limit resets at: ${BOLD}$RESET_TIME${RESET}"
        else
            echo -e "${YELLOW}  Your 5-hour usage window is full.${RESET}"
            echo -e "${YELLOW}  Check the output above for the exact reset time.${RESET}"
        fi
        echo ""
        echo -e "${YELLOW}  No work was lost — progress.md and checklist.md are saved.${RESET}"
        echo -e "${YELLOW}  When your limit resets, press Enter to resume the build.${RESET}"
        echo ""
        read -p "  Press Enter when limit has reset → "
        continue
    fi

    # ── Human approval required ─────────────────────────────────
    if echo "$PROGRESS_TAIL" | grep -qi "AWAITING HUMAN APPROVAL"; then
        echo ""
        echo -e "${BOLD}${YELLOW}╔══════════════════════════════════════════════════╗${RESET}"
        echo -e "${BOLD}${YELLOW}║      PHASE COMPLETE — YOUR REVIEW IS NEEDED      ║${RESET}"
        echo -e "${BOLD}${YELLOW}╚══════════════════════════════════════════════════╝${RESET}"
        echo ""
        echo -e "${YELLOW}  1. Read ${BOLD}progress.md${RESET}${YELLOW} — see what Claude built${RESET}"
        echo -e "${YELLOW}  2. Read ${BOLD}human_review.md${RESET}${YELLOW} — work through the checklist${RESET}"
        echo -e "${YELLOW}  3. Open ${BOLD}progress.md${RESET}${YELLOW} and add ONE line at the very bottom:${RESET}"
        echo ""
        echo -e "       ${GREEN}APPROVED${RESET}                 → Claude begins the next phase"
        echo -e "       ${RED}ISSUE: [what you saw]${RESET}    → Claude fixes and re-presents"
        echo ""
        echo -e "${YELLOW}  4. Press Enter${RESET}"
        echo ""
        read -p "  → "
        continue
    fi

    # ── Claude has a question ────────────────────────────────────
    if echo "$PROGRESS_TAIL" | grep -qi "QUESTION FOR HUMAN"; then
        echo ""
        echo -e "${BOLD}${MAGENTA}╔══════════════════════════════════════════════════╗${RESET}"
        echo -e "${BOLD}${MAGENTA}║           CLAUDE HAS A QUESTION FOR YOU          ║${RESET}"
        echo -e "${BOLD}${MAGENTA}╚══════════════════════════════════════════════════╝${RESET}"
        echo ""
        echo -e "${MAGENTA}  1. Read the question at the bottom of ${BOLD}progress.md${RESET}"
        echo -e "${MAGENTA}  2. Add your answer as a new line at the bottom of ${BOLD}progress.md${RESET}"
        echo -e "${MAGENTA}  3. Press Enter${RESET}"
        echo ""
        read -p "  → "
        continue
    fi

    # ── Blocked after 3 hypotheses ───────────────────────────────
    if echo "$PROGRESS_TAIL" | grep -qi "Status: BLOCKED"; then
        echo ""
        echo -e "${BOLD}${RED}╔══════════════════════════════════════════════════╗${RESET}"
        echo -e "${BOLD}${RED}║              CLAUDE IS BLOCKED                   ║${RESET}"
        echo -e "${BOLD}${RED}╚══════════════════════════════════════════════════╝${RESET}"
        echo ""
        echo -e "${RED}  Claude tried 3 approaches and cannot resolve the problem.${RESET}"
        echo ""
        echo -e "${RED}  1. Read ${BOLD}progress.md${RESET}${RED} — see H1, H2, H3 and the current error${RESET}"
        echo -e "${RED}  2. Check the specific file, URL, or Supabase table mentioned${RESET}"
        echo -e "${RED}  3. Add your guidance at the bottom of ${BOLD}progress.md${RESET}"
        echo -e "${RED}  4. Press Enter — Claude will try again with your guidance${RESET}"
        echo ""
        read -p "  → "
        continue
    fi

    # ── All phases complete ──────────────────────────────────────
    if echo "$PROGRESS_TAIL" | grep -qi "APPROVED_COMPLETE\|all.*phases.*complete\|v1.*complete"; then
        echo ""
        echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════╗${RESET}"
        echo -e "${BOLD}${GREEN}║          V1 BUILD COMPLETE — LOOP ENDING         ║${RESET}"
        echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════╝${RESET}"
        echo ""
        echo -e "${GREEN}  All 14 phases are complete and approved.${RESET}"
        echo -e "${GREEN}  The loop has ended. See progress.md for the full build log.${RESET}"
        echo ""
        exit 0
    fi

    # ── Unexpected / unrecognised output — always stop ──────────────────────
    # If Claude's output does not match any known signal, stop rather than
    # blindly looping. This prevents runaway sessions and forces you to
    # check what actually happened before continuing.
    echo ""
    echo -e "${BOLD}${RED}╔══════════════════════════════════════════════════╗${RESET}"
    echo -e "${BOLD}${RED}║         UNEXPECTED OUTPUT — LOOP PAUSED          ║${RESET}"
    echo -e "${BOLD}${RED}╚══════════════════════════════════════════════════╝${RESET}"
    echo ""
    echo -e "${RED}  Claude's output did not match any expected status signal.${RESET}"
    echo -e "${RED}  Exit code: $EXIT_CODE${RESET}"
    echo ""
    echo -e "${RED}  This could mean:${RESET}"
    echo -e "${RED}    - Claude forgot to write a status line to progress.md${RESET}"
    echo -e "${RED}    - An unexpected error occurred${RESET}"
    echo -e "${RED}    - The session was interrupted${RESET}"
    echo ""
    echo -e "${RED}  What to do:${RESET}"
    echo -e "${RED}    1. Check ${BOLD}progress.md${RESET}${RED} — read the last session entry${RESET}"
    echo -e "${RED}    2. Check ${BOLD}$LOG_FILE${RESET}${RED} — see the full Claude output${RESET}"
    echo -e "${RED}    3. If progress looks good, press Enter to resume${RESET}"
    echo -e "${RED}    4. If something looks wrong, add a note to progress.md first${RESET}"
    echo ""
    read -p "  Press Enter to resume → "

done
