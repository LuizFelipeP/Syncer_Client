import { carregarYjs } from './yjs-loader.js'; // Importar o arquivo centralizado

// Agora, use a função para  garantir que Yjs esteja carregado
carregarYjs().then(() => {
  inicializarYjsEIndexedDB();
}).catch((error) => {
  console.error('Erro ao carregar Yjs e IndexedDB:', error);
});


function inicializarYjsEIndexedDB() {
  const doc = new Y.Doc();
  const ydb = new IndexeddbPersistence('expenseDB', doc);
  const expenseMap = doc.getMap('expenses');

  ydb.on('synced', () => {
    console.log('Dados de gastos sincronizados com IndexedDB');
  });

  const addExpenseBtn = document.getElementById('add-expense-btn');
  const expenseList = document.getElementById('expense-list');

  addExpenseBtn.addEventListener('click', (event) => {
    event.preventDefault();
    const expense = document.getElementById('expense').value;
    const amount = document.getElementById('amount').value;
    const userName = localStorage.getItem('user'); // Obtém o nome do usuário logado

    if (expense && amount && userName) {
      // Verifica se o gasto já existe no Yjs (IndexedDB)
      if (expenseMap.has(expense)) {
        alert('Este gasto já foi registrado anteriormente!');
      } else {
        const now = new Date();
        const date = `${now.toLocaleDateString()} ${now.getHours()}:${now.getMinutes()}`; // Formata sem os segundos

        // Adiciona o gasto à lista de exibição
        const li = document.createElement('li');
        li.textContent = `${expense}: R$ ${amount} - ${date} (Registrado por ${userName})`;
        expenseList?.appendChild(li);

        // Salvar o gasto no Yjs (IndexedDB)
        const expenseId = getNextExpenseId();
        expenseMap.set(expense, {
          id: expenseId,
          amount: amount,
          user: userName,
          date: date,
          timestamp: new Date().toISOString(), // Capturar o timestamp atual
          synced: false
        });

        console.log(`Gasto salvo: ${expense} - R$ ${amount}, ${date} por ${userName}`);
        setInterval(5000);
        window.location.href = '/pages/dashboard.html';
      }
    } else {
      alert('Por favor, preencha todos os campos e verifique se o usuário está logado!');
    }
  });


  // Função para obter o próximo ID sequencial
function getNextExpenseId() {
  // Verificar se já existe um ID salvo no localStorage
  const lastId = localStorage.getItem('lastExpenseId');
  const nextId = lastId ? parseInt(lastId) + 1 : 1; // Se não houver, começar em 1

  // Atualizar o valor no localStorage
  localStorage.setItem('lastExpenseId', nextId);

  return nextId; // Retornar o próximo ID sequencial
}


}

