import { pad2 } from '@/lib/whatsapp';

type Props = { winningNumber: number; winnerName: string | null };

export function WinnerBanner({ winningNumber, winnerName }: Props) {
  return (
    <div className="bg-pink-500 text-white py-6 px-4 text-center shadow-md">
      <p className="text-2xl sm:text-3xl font-bold">
        💖 ¡Rifa cerrada! 💖
      </p>
      <p className="text-xl sm:text-2xl mt-2">
        Número ganador: <span className="font-extrabold">{pad2(winningNumber)}</span>
      </p>
      {winnerName ? (
        <p className="text-lg sm:text-xl mt-2">
          ¡Felicitaciones a <span className="font-bold">{winnerName}</span>!
        </p>
      ) : (
        <p className="text-base mt-2 opacity-90">
          Ese número no fue vendido.
        </p>
      )}
    </div>
  );
}
