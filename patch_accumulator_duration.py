import re

with open('src/components/options/positions/contractDetail.ts', 'r') as f:
    content = f.read()

# First, find where durationLabel is generated
target = """		let durationLabel: string;
		if (backendDurUnit === "t" && backendDurSecs > 0) {
			// Tick-based trade: use requested duration
			durationLabel = `${backendDurSecs} ticks`;
		} else if (backendDurSecs > 0) {
			// Time-based trade (secs, mins, hours): show the stored value directly.
			durationLabel = backendDurUnit === "m"
				? `${backendDurSecs} mins`
				: backendDurUnit === "h"
					? `${backendDurSecs} hours`
					: `${backendDurSecs} secs`;
		} else if (ticks.length > 1) {
			// Fallback: infer from tick_stream if duration_unit not yet stored
			durationLabel = `${ticks.length - 1} ticks`;
		} else {
			// Last resort: epoch diff
			durationLabel = `${seconds} secs`;
		}"""

replacement = """		let durationLabel: string;
		const isAccumulator = h.frontend_contract_type === "accumulators" || h.frontend_contract_type === "ACCU" || (h as any).contract_type === "ACCU";
		
		if (backendDurUnit === "t" && backendDurSecs > 0) {
			// Tick-based trade: use requested duration
			let count = backendDurSecs;
			if (isAccumulator && !won && count > 0) count -= 1;
			durationLabel = `${count} ticks`;
		} else if (backendDurSecs > 0) {
			// Time-based trade (secs, mins, hours): show the stored value directly.
			durationLabel = backendDurUnit === "m"
				? `${backendDurSecs} mins`
				: backendDurUnit === "h"
					? `${backendDurSecs} hours`
					: `${backendDurSecs} secs`;
		} else if (ticks.length > 1) {
			// Fallback: infer from tick_stream if duration_unit not yet stored
			let count = ticks.length - 1;
			if (isAccumulator && !won && count > 0) count -= 1;
			durationLabel = `${count} ticks`;
		} else {
			// Last resort: epoch diff
			durationLabel = `${seconds} secs`;
		}"""

content = content.replace(target, replacement)

with open('src/components/options/positions/contractDetail.ts', 'w') as f:
    f.write(content)
