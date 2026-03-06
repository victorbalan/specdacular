<purpose>
Continue a task's lifecycle. Delegates to brain.md for all flow control, state routing, mode handling, and step dispatch.

This is a thin entry point — the brain does all the work.
</purpose>

<process>

<step name="delegate">
Pass all arguments through to the brain.

The brain handles:
- Argument parsing (task name, --interactive/--auto flags)
- Task validation
- Pipeline resolution (pipeline.json)
- State-based routing
- Mode handling (default/interactive/auto)
- Hook execution
- Step dispatch
- State transitions
- Phase loop management

@~/.claude/specdacular/workflows/brain.md

End workflow.
</step>

</process>
