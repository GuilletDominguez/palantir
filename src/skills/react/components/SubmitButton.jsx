import { useFormStatus } from 'react-dom';
import styles from '../QuestBoard.module.css';

// useFormStatus lee el estado del <form> padre sin pasar props
export default function SubmitButton() {
	const { pending } = useFormStatus();
	return (
		<button type="submit" className={styles.submit} disabled={pending}>
			{pending ? 'Enviando…' : 'Publicar'}
		</button>
	);
}
