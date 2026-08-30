import re

with open('src/components/options/positions/contractDetail.ts', 'r') as f:
    content = f.read()

target = """        buyTransactionId: Number((h as any).buy_transaction_id) || 0,
        sellTransactionId: Number((h as any).sell_transaction_id) || 0,
        duration: durationLabel,
        barrier: parseBarrier(h.barrier, entrySpot),
        startTime,"""

replacement = """        buyTransactionId: Number((h as any).buy_transaction_id) || 0,
        sellTransactionId: Number((h as any).sell_transaction_id) || 0,
        duration: durationLabel,
        barrier: parseBarrier(h.barrier, entrySpot),
        highBarrier: (h as any).high_barrier ? Number((h as any).high_barrier) : undefined,
        lowBarrier: (h as any).low_barrier ? Number((h as any).low_barrier) : undefined,
        startTime,"""

content = content.replace(target, replacement)

with open('src/components/options/positions/contractDetail.ts', 'w') as f:
    f.write(content)
