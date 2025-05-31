import type { Signal } from "@preact/signals";
import Button from "../components/Button.tsx";

interface CounterProps {
	count: Signal<number>;
}

export default function Counter(props: CounterProps) {
	return (
		<div class="flex gap-8 py-6">
			<Button onClick={() => props.count.value -= 1} label="-1" shape="full" />
			<p class="text-3xl tabular-nums">{props.count}</p>
			<Button onClick={() => props.count.value += 1} label="+1" />
		</div>
	);
}
