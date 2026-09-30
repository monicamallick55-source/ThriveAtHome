#!/bin/bash

# =============================================================
# Thrive@Home — Gap Build Loop (G1–G4)
# For Claude Code CLI on Mac, Linux, or GitHub Codespaces
#
# HOW TO RUN:
#   chmod +x build.sh   (already done)
#   ./build-gaps.sh
#
# HOW IT WORKS:
#   Each iteration pipes the build prompt to `claude -p`, which
#   runs Claude non-interactively with full tool access. Claude
#   reads the build files, does its work, writes its status to
#   the last line of gaps/gaps-progress.md, then exits. This script reads
#   that status line and either pauses for your input or
#   immediately starts the next session.
#
# YOUR ONLY ACTIONS:
#   - When paused for approval: open gaps/gaps-progress.md, add APPROVED
#     or ISSUE: [description] at the bottom, press Enter
#   - When paused for a question: add your answer at the bottom
#     of gaps/gaps-progress.md, press Enter
#   - When BLOCKED: add guidance at the bottom of gaps/gaps-progress.md,
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

LOG_FILE="claude-gaps-build.log"

# ── The prompt Claude receives at the start of every session ─
# Kept short intentionally — the detail is in prompt.md.
# Claude reads the files; the prompt just tells it what to do.
PROMPT="You are the autonomous build agent for the Thrive@Home GAP BUILD. You have full permission to read files, write files, create files, and run bash commands. Do not ask for permission. Just build.

Read these files immediately, in this order, before doing anything else:
1. gaps/GAP_BUILD_PROMPT.md  — build order, loop protocol, rules
2. gaps/gaps-progress.md     — where the gap build is now and where to resume
3. The spec file for the current phase (gaps/G1_Call_Pipeline.md … gaps/G6_New_Features.md)

Ignore the root prompt.md, progress.md and checklist.md — they track the original M1-M6 build, not this one.

This loop runs ONE PHASE PER APPROVAL (e.g. G1.1, then stop; G1.2, then stop). This overrides the 'only stop at the end of each spec file' rule in GAP_BUILD_PROMPT.md.

Then act based on the last entry in gaps/gaps-progress.md:
- Last line is AWAITING HUMAN APPROVAL and the human added APPROVED below it: mark that phase COMPLETE and start the next phase
- Human added ISSUE: [text]: fix that issue in the same phase, re-run its checklist, then request approval again
- Human added DONE after an SQL request: continue the phase and run the database checks
- Human added an answer or guidance: use it and continue
- Otherwise resume from the NEXT line

Rules every session:
- Build only the current phase. Never start the next phase without APPROVED from the human
- Never mark [x] without running its VERIFY
- One hypothesis at a time when debugging — max 3, then BLOCKED
- When a phase needs SQL run in Supabase: commit the migration file, then end the session with QUESTION FOR HUMAN and write exactly which file to run and to reply DONE
- When a phase passes its exit gate: commit, push the branch, write a short 'How to check this yourself' list (2-5 steps the human can do in the browser or terminal), then end with AWAITING HUMAN APPROVAL
- When all phases of G6 are approved, write 'ALL GAP PHASES COMPLETE'

End every session by writing one of these as the LAST LINE of gaps/gaps-progress.md:

  AWAITING HUMAN APPROVAL   — phase complete, check steps written
  QUESTION FOR HUMAN        — SQL to run, or info genuinely missing from the specs
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
for f in gaps/GAP_BUILD_PROMPT.md gaps/gaps-progress.md gaps/G1_Call_Pipeline.md; do
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
    echo "Expected files: gaps/GAP_BUILD_PROMPT.md  gaps/gaps-progress.md  gaps/G1_Call_Pipeline.md"
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

    # Read the last 60 lines of gaps/gaps-progress.md and last 20 lines of log
    PROGRESS_TAIL=$(tail -60 gaps/gaps-progress.md 2>/dev/null || echo "")
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
        echo -e "${YELLOW}  No work was lost — gaps/gaps-progress.md is saved.${RESET}"
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
        echo -e "${YELLOW}  1. Read ${BOLD}gaps/gaps-progress.md${RESET}${YELLOW} — see what Claude built${RESET}"
        echo -e "${YELLOW}  2. Follow ${BOLD}How to check this yourself${RESET}${YELLOW} in that entry${RESET}"
        echo -e "${YELLOW}  3. Open ${BOLD}gaps/gaps-progress.md${RESET}${YELLOW} and add ONE line at the very bottom:${RESET}"
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
        echo -e "${MAGENTA}  1. Read the question at the bottom of ${BOLD}gaps/gaps-progress.md${RESET}"
        echo -e "${MAGENTA}  2. Add your answer as a new line at the bottom of ${BOLD}gaps/gaps-progress.md${RESET}"
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
        echo -e "${RED}  1. Read ${BOLD}gaps/gaps-progress.md${RESET}${RED} — see H1, H2, H3 and the current error${RESET}"
        echo -e "${RED}  2. Check the specific file, URL, or Supabase table mentioned${RESET}"
        echo -e "${RED}  3. Add your guidance at the bottom of ${BOLD}gaps/gaps-progress.md${RESET}"
        echo -e "${RED}  4. Press Enter — Claude will try again with your guidance${RESET}"
        echo ""
        read -p "  → "
        continue
    fi

    # ── All phases complete ──────────────────────────────────────
    if echo "$PROGRESS_TAIL" | grep -qi "ALL GAP PHASES COMPLETE"; then
        echo ""
        echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════╗${RESET}"
        echo -e "${BOLD}${GREEN}║          V1 BUILD COMPLETE — LOOP ENDING         ║${RESET}"
        echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════╝${RESET}"
        echo ""
        echo -e "${GREEN}  All 14 phases are complete and approved.${RESET}"
        echo -e "${GREEN}  The loop has ended. See gaps/gaps-progress.md for the full build log.${RESET}"
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
    echo -e "${RED}    - Claude forgot to write a status line to gaps/gaps-progress.md${RESET}"
    echo -e "${RED}    - An unexpected error occurred${RESET}"
    echo -e "${RED}    - The session was interrupted${RESET}"
    echo ""
    echo -e "${RED}  What to do:${RESET}"
    echo -e "${RED}    1. Check ${BOLD}gaps/gaps-progress.md${RESET}${RED} — read the last session entry${RESET}"
    echo -e "${RED}    2. Check ${BOLD}$LOG_FILE${RESET}${RED} — see the full Claude output${RESET}"
    echo -e "${RED}    3. If progress looks good, press Enter to resume${RESET}"
    echo -e "${RED}    4. If something looks wrong, add a note to gaps/gaps-progress.md first${RESET}"
    echo ""
    read -p "  Press Enter to resume → "

done
