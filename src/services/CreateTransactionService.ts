import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    // Verifico se o cliente tem saldo suficiente
    const { total } = await transactionsRepository.getBalance();

    // Se não tiver, retorno erro
    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough balance');
    }

    // Verifico se a categoria já existe
    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    // Se a categoria não existir, eu crio ela
    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(transactionCategory);
    }

    // Se a categoria existir, eu só passo a categoria e crio a minha transaction
    const transaction = await transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
    });

    // Salvo no banco
    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
