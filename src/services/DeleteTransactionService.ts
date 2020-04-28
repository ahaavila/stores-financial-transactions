import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    // Procuro se existe a Transaction
    const transaction = await transactionsRepository.findOne(id);

    // Se não existir, retorno erro
    if (!transaction) {
      throw new AppError('Transaction not found');
    }

    // Se existir, eu removo
    await transactionsRepository.remove(transaction);
  }
}

export default DeleteTransactionService;
