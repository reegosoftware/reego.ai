---
title: "Context engineering: what your agent sees is what it does"
description: >-
  Prompt tweaks stop paying off fast. Reliable agents come from engineering
  the whole context window — instructions, tools, retrieved data and memory —
  as a budgeted, testable system.
tags: [Context engineering, Agents, Tool calling]
author: hasan
---

Most agent failures we get called in to fix are not model failures. The model
did exactly what its context told it to do — the context was just wrong:
a stale document, an ambiguous tool description, 40k tokens of chat history
burying the one instruction that mattered.

That's why we think of **context engineering** as the core skill of building
with LLMs. Prompt engineering asks *"how do I phrase this?"*. Context
engineering asks *"what exactly should the model see at this step, and what
should it not?"*

## The context window is a budget

Every call to a model assembles a context from roughly five sources:

| Source | Example | Typical failure |
|---|---|---|
| System instructions | role, rules, output format | contradictory or buried rules |
| Tool definitions | names, descriptions, JSON schemas | overlapping tools, vague params |
| Retrieved knowledge | docs, rows, search results | irrelevant or stale chunks |
| Memory & history | prior turns, scratchpad, summaries | unbounded growth, lost goals |
| The task itself | user message, current state | missing constraints |

Treat these as line items in a budget. If you can't say how many tokens each
one gets — and why — you're not engineering the context, you're accumulating it.

## 1. Tools are part of the prompt

Tool schemas are read by the model on every turn. A tool named `get_data`
with a description of "Gets data" forces the model to guess. Compare:

```json
{
  "name": "search_customer_orders",
  "description": "Find a customer's orders by email or order ID. Use this before answering any question about order status, shipping or refunds. Returns at most 20 orders, newest first.",
  "input_schema": {
    "type": "object",
    "properties": {
      "email":    { "type": "string", "description": "Customer email, exact match" },
      "order_id": { "type": "string", "description": "e.g. ORD-10293" },
      "status":   { "type": "string", "enum": ["open", "shipped", "refunded"] }
    },
    "anyOf": [{ "required": ["email"] }, { "required": ["order_id"] }]
  }
}
```

The second version tells the model *when* to call the tool, *what it returns*
and *how to fill each argument*. Enums remove a whole class of hallucinated
values. We built [ToolCalling.ai](https://toolcalling.ai) precisely to iterate
on schemas like this against several models side by side.

Rules of thumb we use:

- **Fewer, sharper tools.** Ten overlapping tools perform worse than four
  well-separated ones. If two tools are often confused, merge them or rename them.
- **Describe outputs, not just inputs.** The model plans better when it knows
  what it'll get back.
- **Return compact results.** A tool that returns 300 rows of JSON just spent
  your context budget for you. Summarise, paginate, or return IDs plus a count.

## 2. Retrieval is a ranking problem, not a storage problem

Dumping the top-10 vector hits into the prompt is the default — and the
default is usually wrong. What helps:

1. **Hybrid search** (keyword + vector) for anything with IDs, names or codes.
2. **Rerank, then cut.** Three highly relevant chunks beat ten mediocre ones.
3. **Attach provenance.** Include source and date with each chunk so the model
   can prefer fresh data and cite it.
4. **Let the agent retrieve.** For multi-step tasks, expose retrieval as a tool
   instead of pre-stuffing the context. The agent asks for what it needs, when
   it needs it.

## 3. Memory needs compaction

Long-running agents degrade as their history grows: early instructions get
diluted and the model starts to forget the goal. A simple pattern that works:

```python
def build_context(task, history, budget_tokens=24_000):
    recent = history[-6:]                       # keep last turns verbatim
    older = history[:-6]
    summary = summarize(older) if older else "" # compact the rest
    return [
        system_prompt(),                        # stable, cacheable prefix
        *tool_definitions(),
        {"role": "user", "content": f"Progress so far:\n{summary}"},
        *recent,
        {"role": "user", "content": task},
    ]
```

Keep the stable parts (system prompt, tools) at the front so provider-side
prompt caching kicks in — it's often the single biggest cost and latency win.

## 4. Measure it

Context changes are code changes. Every time you edit a tool description or
retrieval setting, run the same eval set and compare:

- **Task success rate** on 30–100 realistic cases
- **Tool-call accuracy**: right tool, valid arguments, no unnecessary calls
- **Tokens and latency per task**

Without this loop, you're tuning by vibes — and the next model upgrade will
quietly undo half of it.

## The takeaway

Better models raise the ceiling, but context sets the floor. Most of the
reliability we add to client agents comes from deliberately deciding what goes
into each call: sharper tools, ranked retrieval, compacted memory and an eval
suite that keeps everyone honest.

If your agent works in the demo but not in production, the context is the
first place we'd look — [we're happy to take a look with you](/#contact).
