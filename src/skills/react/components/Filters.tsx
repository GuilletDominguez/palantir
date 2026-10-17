import { useId } from 'react';
import type { StatusFilter } from '../types';
import styles from '../QuestBoard.module.css';

const STATUSES: StatusFilter[] = ['todas', 'pendientes', 'completadas'];

interface Props {
	status: StatusFilter;
	onStatusChange: (status: StatusFilter) => void;
	query: string;
	onQueryChange: (query: string) => void;
}

// Componente controlado: el estado vive en el padre y llega por props
export default function Filters({ status, onStatusChange, query, onQueryChange }: Props) {
	const searchId = useId();

	return (
		<div className={styles.filters}>
			<div className={styles.field}>
				<label htmlFor={searchId}>Buscar misión</label>
				<input
					id={searchId}
					type="search"
					value={query}
					onChange={(e) => onQueryChange(e.target.value)}
					placeholder="puente, cripta..."
					autoComplete="off"
				/>
			</div>

			<fieldset className={styles.tabs}>
				<legend className="sr-only">Estado</legend>
				{STATUSES.map((s) => (
					<label key={s} className={s === status ? styles.tabActive : styles.tab}>
						<input
							type="radio"
							name="react-quest-status"
							value={s}
							checked={s === status}
							onChange={() => onStatusChange(s)}
						/>
						{s}
					</label>
				))}
			</fieldset>
		</div>
	);
}
