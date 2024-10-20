// Definir expenseMap fora das funções para que possa ser acessado globalmente
let expenseMap;

document.addEventListener('DOMContentLoaded', () => {

    const userName = localStorage.getItem('user');
    const welcomeMessage = document.getElementById('welcome-message');
    const expenseList = document.getElementById('expense-list');

    // Importar o yjs-loader para carregar Yjs e IndexedDB
    import('./yjs-loader.js') // Certifique-se de que o caminho esteja correto
        .then(module => {
            const { carregarYjs } = module; // Extrair a função carregarYjs
            return carregarYjs(); // Chamar a função para carregar Yjs
        })
        .then(() => {
            // Somente após carregar Yjs, carregar os gastos
            console.log('Yjs carregado. Carregando gastos...');
            carregarGastos();
            setInterval(sincronizarComServidor, 5000); // A cada 5 segundos
        })
        .catch((error) => {
            console.error('Erro ao carregar Yjs e IndexedDB:', error);
        });

    if (userName) {
        welcomeMessage.textContent = `Bem-vindo, ${userName}!`;

    } else { window.location.href = '/index.html';

    }
});



// Função para carregar os gastos
// Função para carregar os gastos
function carregarGastos() {
    const doc = new Y.Doc();
    const ydb = new IndexeddbPersistence('expenseDB', doc);
    expenseMap = doc.getMap('expenses');

    ydb.on('synced', async () => {
        console.log('IndexedDB sincronizado, carregando gastos...');

        // Buscar os gastos do servidor
        const gastosDoServidor = await carregarGastosDoServidor();

        // Limpa a tabela antes de preencher
        const expenseList = document.getElementById('expense-list');
        expenseList.innerHTML = '';

        // Sincronizar os gastos locais com os do servidor
        const gastosParaEnviar = [];

        expenseMap.forEach((value, key) => {
            // Verifica se o gasto já está no servidor
            const servidorGasto = gastosDoServidor.find(gasto => gasto.description === key);
            if (!servidorGasto) {
                // Se o gasto não existir no servidor, adiciona para enviar
                gastosParaEnviar.push({ key, ...value });
                exibirGasto(key, value, false); // Mostra como não sincronizado
            } else {
                // Verifica se as informações locais e do servidor são diferentes
                if (servidorGasto.amount !== value.amount || servidorGasto.date !== value.date || servidorGasto.user !== value.user) {
                    gastosParaEnviar.push({ key, ...value });
                }
                exibirGasto(key, value, true); // Mostra como sincronizado
            }
        });

        // Enviar os gastos locais que precisam ser sincronizados
        if (gastosParaEnviar.length > 0) {
            sincronizarComServidor(gastosParaEnviar);
        }

        // Exibir os gastos do servidor que não estão no IndexedDB local
        gastosDoServidor.forEach(gasto => {
            if (!expenseMap.has(gasto.description)) {
                exibirGasto(gasto.description, {
                    amount: gasto.amount,
                    user: gasto.user,
                    date: gasto.date,
                    synced: true
                }, true);
            }
        });

        console.log('Gastos carregados com sucesso');
    });
}


// Ajustar a função de sincronização com o servidor
function sincronizarComServidor() {
    if (!expenseMap) {
        console.error('expenseMap não está definido'); // Adicionar uma verificação se o expenseMap não foi carregado corretamente
        return;
    }

    // Sincronizar os gastos locais com o servidor
    const gastosParaEnviar = [];
    expenseMap.forEach((value, key) => {
        gastosParaEnviar.push({ key, ...value }); // Garantir que estamos criando um array de objetos corretamente
    });

    if (gastosParaEnviar.length === 0) {
        console.log('Nenhum gasto para sincronizar');
        return; // Se não há gastos, sair da função
    }

    console.log('Enviando gastos para o servidor:', gastosParaEnviar); // Debug dos dados enviados

    fetch('http://localhost:4000/api/add-expenses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expenses: gastosParaEnviar }) // Certifique-se de que estamos enviando como "expenses"
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta do servidor');
            }
            return response.json(); // Converter a resposta em JSON
        })
        .then(servidorExpenses => {
            console.log('Gastos recebidos do servidor após sincronização:', servidorExpenses); // Verifique a estrutura aqui
            if (Array.isArray(servidorExpenses)) {
                servidorExpenses.forEach(expense => {
                    exibirGasto(expense.description, {
                        amount: expense.amount,
                        user: expense.user,
                        date: expense.date,
                        synced: true
                    });
                });
            } else {
                console.error('A resposta do servidor não é uma lista:', servidorExpenses);
            }
        })
        .catch(error => {
            console.error('Erro ao sincronizar com o servidor:', error);
        });
}

// Função para carregar os gastos do servidor
function carregarGastosDoServidor() {
    return fetch('http://localhost:4000/api/expenses')
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Erro ao carregar gastos do servidor');
            }
        })
        .then(data => {
            console.log('Gastos carregados do servidor:', data);
            return data;
        })
        .catch(error => {
            console.error('Erro ao carregar dados do servidor:', error);
            return [];
        });
}

// Função para exibir um gasto na tabela
function exibirGasto(key, value, synced) {

        const tr = document.createElement('tr');
        // Status (sincronizado ou não)
        const statusTd = document.createElement('td');
        const statusCircle = document.createElement('span');
        statusCircle.classList.add('status-circle');
        statusCircle.classList.add(value.synced ? 'status-synced' : 'status-not-synced');
        statusCircle.setAttribute('data-expense-key', key); // Adiciona um identificador para a bolinha
        statusTd.appendChild(statusCircle);

        // Usuário que fez o gasto
        const userTd = document.createElement('td');
        userTd.textContent = value.user;

        // Descrição do gasto
        const descriptionTd = document.createElement('td');
        descriptionTd.textContent = key;

        // Valor do gasto
        const amountTd = document.createElement('td');
        amountTd.textContent = `R$ ${value.amount}`;

        // Data do gasto
        const dateTd = document.createElement('td');
        dateTd.textContent = value.date;

        // Botão de remover
        const actionTd = document.createElement('td');
        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-expense-btn');
        removeBtn.innerHTML = 'X';
        removeBtn.addEventListener('click', () => {
            removerGasto(key, value); // Chama a função para remover e enviar ao servidor
            tr.remove(); // Remove o item da lista na interface imediatamente
        });
        actionTd.appendChild(removeBtn);

        const editBtn = document.createElement('button');
        editBtn.classList.add('edit-expense-btn');
        editBtn.innerHTML = '✏️'; // Ícone de lápis
        editBtn.addEventListener('click', () => {
            window.location.href = `../pages/editar.html?key=${encodeURIComponent(key)}`;
        });
        actionTd.appendChild(editBtn);


        // Adiciona os elementos à linha (tr) na ordem correta
        tr.appendChild(statusTd);
        tr.appendChild(userTd);
        tr.appendChild(descriptionTd);
        tr.appendChild(amountTd);
        tr.appendChild(dateTd);
        tr.appendChild(actionTd);

        // Adiciona a linha ao corpo da tabela
        const expenseList = document.getElementById('expense-list');
        expenseList.appendChild(tr);

}

// Função para remover gasto
function removerGasto(key, value) {
    const doc = new Y.Doc();
    const ydb = new IndexeddbPersistence('expenseDB', doc);
    const expenseMap = doc.getMap('expenses');

    ydb.on('synced', () => {
        expenseMap.delete(key); // Remove o gasto do Yjs map
        console.log(`Gasto "${key}" removido`);

        // Enviar a remoção ao servidor
        fetch('http://localhost:4000/api/gastos', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key, value })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Remoção sincronizada com o servidor:', data);
            })
            .catch(error => {
                console.error('Erro ao remover gasto do servidor:', error);
            });
    });
}





// Redirecionar para a página de adição de gastos
const addExpenseBtn = document.getElementById('add-expense-btn');
addExpenseBtn.addEventListener('click', () => {
    window.location.href = '../pages/add-expense.html';
});

// Logout
const logoutBtn = document.getElementById('logout-btn');
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = '/index.html';



});

