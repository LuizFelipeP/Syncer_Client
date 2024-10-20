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
        expenseMap.set(expense, {
          amount: amount,
          user: userName,
          date: date
        });

        console.log(`Gasto salvo: ${expense} - R$ ${amount}, ${date} por ${userName}`);
        enviarGastoParaServidor({ expense, amount, userName, date });
      }
    } else {
      alert('Por favor, preencha todos os campos e verifique se o usuário está logado!');
    }
  });

  const backToDashboardBtn = document.getElementById('back-to-dashboard');
  backToDashboardBtn.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.href = '/pages/dashboard.html';
  });


  function enviarGastoParaServidor(gasto) {
    fetch('http://localhost:4000/api/add-expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userName: gasto.userName,
        description: gasto.expense,  // Alterado de 'expense' para 'description'
        amount: gasto.amount,
        date: gasto.date
      })
    })
        .then(response => {
          if (!response.ok) {
            throw new Error('Erro ao salvar gasto no servidor');
          }
          return response.json();
        })
        .then(data => {
          console.log('Gasto enviado com sucesso para o servidor:', data);
        })
        .catch(error => {
          console.error('Erro ao enviar gasto para o servidor:', error);
        });
  }
}

