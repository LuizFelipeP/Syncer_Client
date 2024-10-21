// Definir expenseMap fora das funções para que possa ser acessado globalmente
let expenseMap;

document.addEventListener('DOMContentLoaded', () => {

    const userName = localStorage.getItem('user');
    const welcomeMessage = document.getElementById('welcome-message');

    // Importar o yjs-loader para carregar Yjs e IndexedDB
    import('./yjs-loader.js') // Certifique-se de que o caminho esteja correto
        .then(module => {
            const { carregarYjs } = module; // Extrair a função carregarYjs
            return carregarYjs(); // Chamar a função para carregar Yjs
        })

        .then(() => {
            // Somente após carregar Yjs, carregar os gastos
            console.log('Yjs carregado. Aguardando WebSocket...');
            carregarGastosLocais(); // Carregar os gastos após estabelecer a conexão

        })
        .catch((error) => {
            console.error('Erro ao carregar Yjs e IndexedDB:', error);
        })

    if (userName) {
        welcomeMessage.textContent = `Bem-vindo, ${userName}!`;

    } else { window.location.href = '/index.html';

    }
});


// Ajustar a função de sincronização com o servidor
function carregarGastosLocais() {
    const doc = new Y.Doc();
    const ydb = new IndexeddbPersistence('expenseDB', doc);
    expenseMap = doc.getMap('expenses');

    ydb.on('synced', async () => {
        console.log('IndexedDB sincronizado, carregando gastos locais...');

        // Limpar a tabela antes de preencher
        const expenseList = document.getElementById('expense-list');
        expenseList.innerHTML = '';

        // Exibir os gastos armazenados localmente
        expenseMap.forEach((value, key) => {
            console.log('Exibindo gasto local:', key, value);
            exibirGasto(key, value, true); // Mostrar como sincronizado
        });

        // Agora, sincronizar os dados com o servidor
        sincronizarComServidor();
    });
}


// Função para carregar os gastos do servidor
function sincronizarComServidor() {
    const gastosParaEnviar = [];

    // Filtrar apenas os gastos que não estão sincronizados
    expenseMap.forEach((value, key) => {
        if (!value.synced) { // Verificar se o gasto não está sincronizado
            gastosParaEnviar.push({ key, ...value });
        }
    });

    if (gastosParaEnviar.length > 0) {
        console.log('Enviando gastos para o servidor:', gastosParaEnviar);

        // Enviar os gastos para o servidor via POST
        fetch('http://localhost:4000/api/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ expenses: gastosParaEnviar })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Gastos sincronizados com o servidor:', data);
        })
        .catch(error => {
            console.log(gastosParaEnviar);
            console.error('Erro ao sincronizar com o servidor:', error);
        });
    } else {
        console.log('Nenhum gasto para sincronizar.');
    }
}

// Função para exibir um gasto na tabela
function exibirGasto(key, value, synced) {

    const tr = document.createElement('tr');

    // Status (sincronizado ou não)
    const statusTd = document.createElement('td');
    const statusCircle = document.createElement('span');
    statusCircle.classList.add('status-circle');
    statusCircle.classList.add(synced ? 'status-synced' : 'status-not-synced');
    statusCircle.setAttribute('data-expense-key', key);
    statusTd.appendChild(statusCircle);

    // Usuário, Descrição, Valor e Data
    const userTd = document.createElement('td');
    userTd.textContent = value.user;

    const descriptionTd = document.createElement('td');
    descriptionTd.textContent = key;

    const amountTd = document.createElement('td');
    amountTd.textContent = `R$ ${value.amount}`;

    const dateTd = document.createElement('td');
    dateTd.textContent = value.date;

    // Botões de ação (Remover e Editar)
    const actionTd = document.createElement('td');
    const removeBtn = document.createElement('button');
    removeBtn.classList.add('remove-expense-btn');
    removeBtn.innerHTML = 'X';
    removeBtn.addEventListener('click', () => {
        removerGasto(key); // Chama a função para remover e enviar ao servidor
        tr.remove(); // Remove o item da lista na interface imediatamente
    });

    const editBtn = document.createElement('button');
    editBtn.classList.add('edit-expense-btn');
    editBtn.innerHTML = '✏️'; // Ícone de lápis
    editBtn.addEventListener('click', () => {
        window.location.href = `../pages/editar.html?key=${encodeURIComponent(key)}`;
    });
    actionTd.appendChild(removeBtn);
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

// Função para remover gasto aaaaaaaa
function removerGasto(key, value) {
    const doc = new Y.Doc();
    const ydb = new IndexeddbPersistence('expenseDB', doc);
    const expenseMap = doc.getMap('expenses');

    ydb.on('synced', () => {
        expenseMap.delete(key); // Remove o gasto do Yjs map
        console.log(`Gasto "${key}" removido`);

        // Enviar a remoção ao servidor
        fetch('http://localhost:4000/api/sync', {
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

