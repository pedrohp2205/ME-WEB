// Avaliações públicas do profissional (somente leitura; sem identificar o paciente).
import { api } from "./http";

export interface PublicReview {
  id: string;
  /** Nota de 1 a 5. */
  rating: number;
  comment: string | null;
  createdAt: string;
}

/** O endpoint pode vir paginado ({content,…}) ou como lista — tratamos os dois. */
interface ReviewsPage {
  content: PublicReview[];
}

/** Lista as avaliações do profissional (id = doctor.id do getMe). */
export async function listProfessionalReviews(professionalId: string): Promise<PublicReview[]> {
  const r = await api.get<ReviewsPage | PublicReview[]>(
    `/reviews/professional/${professionalId}`,
    { query: { size: 100 } },
  );
  return Array.isArray(r) ? r : (r?.content ?? []);
}
