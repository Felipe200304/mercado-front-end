let modoEdicao = false;
let produtoIdEdicao = null;

function mostrarSecao(secaoId) {
    console.log(`Tentando exibir a seção: ${secaoId}`);

    // Esconde a seção atual
    const secaoAtual = document.querySelector('.secao:not(.hidden)');
    if (secaoAtual) {
        console.log(`Seção atual: ${secaoAtual.id}`);
        secaoAtual.classList.add('hidden');
    } else {
        console.log('Nenhuma seção atualmente visível.');
    }

    // Exibe a nova seção
    const novaSecao = document.getElementById(secaoId);
    if (novaSecao) {
        console.log(`Nova seção encontrada: ${novaSecao.id}`);
        novaSecao.classList.remove('hidden');  // Exibe a nova seção
    } else {
        console.error(`Seção com ID "${secaoId}" não encontrada`);
    }
}

// Função para calcular o preço sugerido
function calcularPrecoSugerido() {
    const custo = parseFloat(document.getElementById('custo').value) || 0;
    const percentualLucro = parseFloat(document.getElementById('percentualLucro').value) || 0;

    const precoSugerido = custo * (1 + percentualLucro / 100);
    document.getElementById('precoSugerido').value = precoSugerido ? precoSugerido.toFixed(2) : '';
}

// Eventos para calcular preço sugerido automaticamente
['custo', 'percentualLucro'].forEach(id =>
    document.getElementById(id).addEventListener('input', calcularPrecoSugerido)
);

// Função para listar todos os produtos
function listarProdutos() {
    fetch('http://localhost:8080/api/itens')
        .then(response => response.json())
        .then(produtos => {
            const listaProdutosDiv = document.getElementById('lista-produtos');
            listaProdutosDiv.innerHTML = '';

            produtos.forEach(produto => {
                const produtoDiv = document.createElement('div');
                produtoDiv.classList.add('produto');
                produtoDiv.innerHTML = `
                    <p><strong>Nome:</strong> ${produto.nomeProduto || 'Não disponível'}</p>
                    <p><strong>Código:</strong> ${produto.codigo || 'Não disponível'}</p>
                    <p><strong>Descrição:</strong> ${produto.descricao || 'Não disponível'}</p>
                    <p><strong>Quantidade:</strong> ${produto.quantidade || 'Não disponível'}</p>
                    <p><strong>Preço de Custo:</strong> R$ ${produto.custo || '0.00'}</p>
                    <p><strong>Preço Sugerido:</strong> R$ ${produto.precoSugerido || '0.00'}</p>
                    <p><strong>Percentual de Lucro:</strong> ${produto.percentualLucro || '0'}%</p>
                    <p><strong>Categoria:</strong> ${produto.categoria || 'Não disponível'}</p>
                    <p><strong>Valor de Venda:</strong> R$ ${produto.valorVenda || '0.00'}</p>
                    <button onclick="editarProduto(${produto.id})">Editar</button>
                    <button onclick="deletarProduto(${produto.id})">Deletar</button>
                `;
                listaProdutosDiv.appendChild(produtoDiv);
            });
        })
        .catch(error => console.error('Erro ao listar produtos:', error));
}

// Função para cadastrar ou atualizar um produto
document.getElementById('form-cadastro').addEventListener('submit', function (event) {
    event.preventDefault();

    const produto = {
        nomeProduto: document.getElementById('nomeProduto').value,
        codigo: document.getElementById('codigo').value,
        descricao: document.getElementById('descricao').value,
        quantidade: document.getElementById('quantidade').value,
        custo: document.getElementById('custo').value,
        precoSugerido: document.getElementById('precoSugerido').value,
        percentualLucro: document.getElementById('percentualLucro').value,
        categoria: document.getElementById('categoria').value,
        valorVenda: document.getElementById('valorVenda').value,
    };

    const url = modoEdicao
        ? `http://localhost:8080/api/itens/${produtoIdEdicao}`
        : 'http://localhost:8080/api/itens';
    const method = modoEdicao ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(produto),
    })
        .then(() => {
            alert(modoEdicao ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
            resetarFormulario();
            listarProdutos();
            mostrarSecao('tela-estoque');
        })
        .catch(error => console.error('Erro ao salvar produto:', error));
});

// Função para editar um produto
function editarProduto(id) {
    modoEdicao = true;
    produtoIdEdicao = id;

    fetch(`http://localhost:8080/api/itens/${id}`)
        .then(response => response.json())
        .then(produto => {
            Object.keys(produto).forEach(key => {
                const campo = document.getElementById(key);
                if (campo) campo.value = produto[key];
            });

            mostrarSecao('cadastro-item');
        })
        .catch(error => console.error('Erro ao carregar produto para edição:', error));
}

// Função para resetar o formulário
function resetarFormulario() {
    document.getElementById('form-cadastro').reset();
    modoEdicao = false;
    produtoIdEdicao = null;
}

// Função para deletar um produto
function deletarProduto(id) {
    if (confirm('Tem certeza que deseja deletar este produto?')) {
        fetch(`http://localhost:8080/api/itens/${id}`, {
            method: 'DELETE',
        })
            .then(() => {
                alert('Produto deletado com sucesso!');
                listarProdutos();
            })
            .catch(error => console.error('Erro ao deletar produto:', error));
    }
}

// Função para buscar um produto
async function buscarProduto(codigo) {
    try {
        const response = await fetch(`http://localhost:8080/api/itens/buscar?codigo=${codigo}`);
        if (!response.ok) throw new Error('Produto não encontrado');
        return await response.json();
    } catch (error) {
        alert(error.message);
        return null;
    }
}

// Função para adicionar produto ao carrinho
async function adicionarProdutoAoCarrinho() {
    const codigo = document.getElementById('codigo_1').value;
    const produto = await buscarProduto(codigo);

    if (!produto) return;

    const carrinho = document.getElementById('carrinho');
    const existe = [...carrinho.querySelectorAll('.carrinho-item')].some(
        item => item.getAttribute('data-codigo') === codigo
    );

    if (existe) {
        alert('Produto já adicionado ao carrinho!');
        return;
    }

    const itemCarrinho = document.createElement('div');
    itemCarrinho.classList.add('carrinho-item');
    itemCarrinho.setAttribute('data-codigo', codigo);
    itemCarrinho.innerHTML = `
        <p>Produto: ${produto.nomeProduto}</p>
        <p>Preço: R$ ${parseFloat(produto.valorVenda).toFixed(2)}</p>
        <p>Quantidade: <input type="number" value="1" min="1" class="quantidade" onchange="atualizarTotal()"></p>
        <button onclick="removerProduto(this)">Remover</button>
    `;

    carrinho.appendChild(itemCarrinho);
    atualizarTotal();
}

// Função para atualizar total
function atualizarTotal() {
    const produtosNoCarrinho = document.querySelectorAll('.carrinho-item');
    let total = 0;

    produtosNoCarrinho.forEach(produto => {
        const quantidade = parseFloat(produto.querySelector('.quantidade').value);
        const preco = parseFloat(produto.querySelector('p:nth-child(2)').innerText.replace('Preço: R$', ''));
        total += quantidade * preco;
    });

    document.getElementById('total-compra').innerText = `R$ ${total.toFixed(2)}`;
}

// Função para remover produto do carrinho
function removerProduto(button) {
    button.closest('.carrinho-item').remove();
    atualizarTotal();
}


// Atualizar troco
function atualizarTroco() {
    const valorRecebido = parseFloat(document.getElementById('valor-recebido').value) || 0;
    const totalCompra = parseFloat(document.getElementById('total-compra').textContent.replace('R$', '').trim()) || 0;
    const troco = valorRecebido - totalCompra;

    document.getElementById('troco').textContent = troco >= 0 ? troco.toFixed(2) : "0.00";

    const trocoContainer = document.getElementById('troco-container');
    trocoContainer.style.display = 'block';  
}


// Função para finalizar venda
function finalizarVenda() {
    const carrinhoItems = document.querySelectorAll('.carrinho-item');
    if (carrinhoItems.length === 0) {
        alert('O carrinho está vazio.');
        return;
    }

    const produtosVenda = [...carrinhoItems].map(item => {
        const codigo = item.getAttribute('data-codigo');
        const preco = parseFloat(item.querySelector('p:nth-child(2)').innerText.replace('Preço: R$', ''));
        const quantidade = parseInt(item.querySelector('.quantidade').value);
        return { codigo, preco, quantidade, subtotal: (preco * quantidade).toFixed(2) };
    });

    const totalCompra = produtosVenda.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    const valorPago = parseFloat(document.getElementById('valor-recebido').value) || 0;
    const troco = valorPago - totalCompra;

    if (troco < 0) {
        alert('O valor pago é menor que o total da compra.');
        return;
    }

    fetch('http://localhost:8080/api/venda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            valorCompra: totalCompra.toFixed(2),
            valorPago: valorPago.toFixed(2),
            troco: troco.toFixed(2),
            produtos: produtosVenda,
        }),
    })
        .then(() => {
            alert('Venda finalizada com sucesso!');
            document.getElementById('valor-recebido').value = '';
            document.getElementById('carrinho').innerHTML = '';
            atualizarTotal();
        })
        .catch(error => console.error('Erro ao finalizar venda:', error));
}



function listarVendas() {
    fetch('http://localhost:8080/api/venda')
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha na requisição: ' + response.statusText);
            }
            return response.json();
        })
        .then(vendas => {
            console.log('Dados recebidos:', vendas);

            const listaVendasDiv = document.getElementById('listar-vendas-container');
            listaVendasDiv.innerHTML = '';

            if (vendas.length === 0) {
                listaVendasDiv.innerHTML = '<p>Nenhuma venda encontrada.</p>';
            } else {
                vendas.forEach(venda => {
                    console.log('Processando venda:', venda);
                    const vendaDiv = document.createElement('div');
                    vendaDiv.classList.add('venda');

                    vendaDiv.innerHTML = `
                        <p><strong>ID da Venda:</strong> ${venda.id || 'Não disponível'}</p>
                        <p><strong>Valor da Compra:</strong> R$ ${(parseFloat(venda.valorCompra) || 0).toFixed(2)}</p>
                        <p><strong>Valor Pago:</strong> R$ ${(parseFloat(venda.valorPago) || 0).toFixed(2)}</p>
                        <p><strong>Troco:</strong> R$ ${(parseFloat(venda.troco) || 0).toFixed(2)}</p>
                        <button onclick="editarVenda(${venda.id})">Editar</button>
                        <button onclick="deletarVenda(${venda.id})">Deletar</button>
                    `;

                    listaVendasDiv.appendChild(vendaDiv);
                });
            }


            //mostrarSecao('lista-vendas');
        })
        .catch(error => {
            console.error('Erro ao listar vendas:', error);
            const listaVendasDiv = document.getElementById('listar-vendas-container'); // Alterado aqui
            listaVendasDiv.innerHTML = '<p>Erro ao carregar vendas. Tente novamente mais tarde.</p>';
        });
}

function editarVenda(id) {
    fetch(`http://localhost:8080/api/venda/${id}`)
        .then(response => response.json())
        .then(venda => {

            console.log(venda);

            const listaEditarVendasDiv = document.getElementById('lista-editar-vendas-container');
            listaEditarVendasDiv.innerHTML = '';

            const editarVendaDiv = document.createElement('div');
            editarVendaDiv.classList.add('editar-venda');

            editarVendaDiv.innerHTML = `
                        <p><strong>ID da Venda:</strong> ${venda.id || 'Não disponível'}</p>
                        <label for="valorCompra"><strong>Valor da Compra:</strong></label>
                        <input type="text" id="valorCompra" value="${(parseFloat(venda.valorCompra) || 0).toFixed(2)}"><strong></strong></input>
                        <label for="valorPago"><strong>Valor Recebido:</strong></label>
                        <input type="text" id="valorPago" value="${(parseFloat(venda.valorPago) || 0).toFixed(2)}"><strong></strong></input>
                        <label for="trocoVenda"><strong>Troco:</strong></label>
                        <input type="text" id="trocoVenda" value="${(parseFloat(venda.troco) || 0).toFixed(2)}"><strong>Troco:</strong></p>
                        <button onclick="atualizarVenda(${venda.id})">Atualizar Venda</button>
                        <button onclick="deletarVenda(${venda.id})">Deletar</button>
                    `;


            listaEditarVendasDiv.appendChild(editarVendaDiv);
            mostrarSecao('editar-vendas-container');
        })
        .catch(error => console.error('Erro ao carregar dados para edição:', error));
}

function atualizarVenda(id) {
    const totalCompra = document.getElementById('valorCompra').value;
    const valorPago = document.getElementById('valorPago').value;
    const troco = document.getElementById('trocoVenda').value;

    console.log(totalCompra);
    console.log(valorPago);
    console.log(troco);


    fetch(`http://localhost:8080/api/venda/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            valorCompra: totalCompra,
            valorPago: valorPago,
            troco: troco
        }),
    })
        .then(() => {
            alert('Venda atualizada com sucesso!');
            listarVendas();
            mostrarSecao('lista-vendas');
        })
        .catch(error => console.error('Erro ao finalizar venda:', error));
}


function deletarVenda(id) {
    if (confirm('Tem certeza que deseja deletar esta venda?')) {
        fetch(`http://localhost:8080/api/venda/${id}`, {
            method: 'DELETE',
        })
            .then(() => {
                alert('Venda deletada com sucesso!');
                listarVendas();
            })
            .catch(error => console.error('Erro ao deletar venda:', error));
    }
}




let modoEdicaoFuncionario = false;
let funcionarioCpfEdicao = null;


document.addEventListener('DOMContentLoaded', function () {
    listarFuncionarios();
});

function listarFuncionarios() {
    const listaFuncionariosDiv = document.getElementById('lista-funcionarios'); 

    fetch('http://localhost:8080/api/funcionarios')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar funcionários');
            }
            return response.json();
        })
        .then(funcionarios => {
            console.log('Funcionários recebidos:', funcionarios);  

            listaFuncionariosDiv.innerHTML = '';  // Limpa a mensagem de carregamento

            if (funcionarios.length === 0) {
                listaFuncionariosDiv.innerHTML = '<p>Nenhum funcionário encontrado.</p>';
                return;
            }

            funcionarios.forEach(funcionario => {
                const funcionarioDiv = document.createElement('div');
                funcionarioDiv.classList.add('funcionario');
                funcionarioDiv.innerHTML = `
                    <p><strong>CPF:</strong> ${funcionario.cpf || 'Não disponível'}</p>
                    <p><strong>Nome:</strong> ${funcionario.nome || 'Não disponível'}</p>
                    <p><strong>Permissão:</strong> ${funcionario.permissao || 'Não disponível'}</p>
                    <p><strong>Salário (220h):</strong> R$ ${funcionario.salario220h || '0.00'}</p>
                    <p><strong>Horas Trabalhadas:</strong> ${funcionario.horasTrabalhadas || 'Não disponível'}</p>
                    <button onclick="editarFuncionario('${funcionario.cpf}')">Editar</button>
                    <button onclick="deletarFuncionario('${funcionario.cpf}')">Deletar</button>
                `;
                listaFuncionariosDiv.appendChild(funcionarioDiv);
            });
        })
        .catch(error => {
            listaFuncionariosDiv.innerHTML = '<p>Erro ao carregar funcionários.</p>';
            console.error('Erro ao listar funcionários:', error);
        });
}


document.getElementById('form-cadastro-funcionario').addEventListener('submit', function (event) {
    event.preventDefault();  // Previne o envio do formulário

    const funcionario = {
        cpf: document.getElementById('cpf').value,
        nome: document.getElementById('nome').value,
        senha: document.getElementById('senha').value,
        permissao: document.getElementById('permissao').value,
        horasTrabalhadas: document.getElementById('horasTrabalhadas').value,
        salario220h: document.getElementById('salario220h').value,

    };


    const url = modoEdicaoFuncionario
        ? `http://localhost:8080/api/funcionarios/${funcionario.cpf}`
        : 'http://localhost:8080/api/funcionarios';  // Caso seja um novo cadastro, a URL será para a criação

    const method = modoEdicaoFuncionario ? 'PUT' : 'POST';

    // Faz a requisição HTTP com fetch
    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(funcionario),
    })
        .then(() => {

            alert(modoEdicaoFuncionario ? 'Funcionário atualizado com sucesso!' : 'Funcionário cadastrado com sucesso!');
            resetarFormularioFuncionario();
            listarFuncionarios();
            mostrarSecao('listar-funcionarios');
        })
        .catch(error => console.error('Erro ao salvar funcionário:', error));
});

// Função para editar um funcionário
function editarFuncionario(cpf) {
    modoEdicaoFuncionario = true;
    funcionarioCpfEdicao = cpf;

    fetch(`http://localhost:8080/api/funcionarios/${cpf}`)
        .then(response => response.json())
        .then(funcionario => {
            // Preenche o formulário com os dados do funcionário
            document.getElementById('cpf').value = funcionario.cpf;
            document.getElementById('nome').value = funcionario.nome;
            document.getElementById('senha').value = funcionario.senha;
            document.getElementById('permissao').value = funcionario.permissao;
            document.getElementById('horasTrabalhadas').value = funcionario.horasTrabalhadas;
            document.getElementById('salario220h').value = funcionario.salario220h;

            // Exibe a seção de cadastro de funcionário
            mostrarSecao('cadastro-funcionario');
        })
        .catch(error => console.error('Erro ao carregar funcionário para edição:', error));
}


// Função para resetar o formulário
function resetarFormularioFuncionario() {
    document.getElementById('form-cadastro-funcionario').reset();
    modoEdicaoFuncionario = false;
    funcionarioCpfEdicao = null;
}

function deletarFuncionario(cpf) {
    if (confirm('Tem certeza que deseja deletar este funcionário?')) {
        fetch(`http://localhost:8080/api/funcionarios/${cpf}`, {
            method: 'DELETE',
        })
            .then(() => {
                alert('Funcionário deletado com sucesso!');
                listarFuncionarios(); // Atualiza a lista de funcionários após a exclusão
            })
            .catch(error => console.error('Erro ao deletar funcionário:', error));
    }
}   