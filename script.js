const API_URL = 'http://localhost:5000';
const form = document.getElementById('task-form');

// Carregar tarefas ao iniciar
window.addEventListener('DOMContentLoaded', () => {
  carregarTarefas();
  setInterval(buscarAlertas, 60000); // 1 min
  buscarAlertas();
  carregarUsuarios(); // Carrega usuários para seleção
  carregarListaUsuarios(); // Carrega lista de usuários cadastrados
});

// Cadastro de novo usuário
const userForm = document.getElementById('user-form');
userForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('user-nome').value;
  const email = document.getElementById('user-email').value;
  const usuario = { nome, email };
  const resp = await fetch(`${API_URL}/usuario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuario)
  });
  if (resp.ok) {
    userForm.reset();
    carregarUsuarios();
    carregarListaUsuarios();
    alert('Usuário cadastrado!');
  } else {
    const erro = await resp.json();
    alert(erro.message || 'Erro ao cadastrar usuário.');
  }
});

// Carregar usuários para seleção no formulário
async function carregarUsuarios() {
  const resp = await fetch(`${API_URL}/usuarios`);
  const data = await resp.json();
  const select = document.getElementById('usuario_id');
  select.innerHTML = '';
  data.usuarios.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = `${u.nome} (${u.email})`;
    select.appendChild(opt);
  });
}

// Carregar lista de usuários cadastrados
async function carregarListaUsuarios() {
  const resp = await fetch(`${API_URL}/usuarios`);
  const data = await resp.json();
  const ul = document.getElementById('users-list');
  ul.innerHTML = '';
  data.usuarios.forEach(u => {
    const li = document.createElement('li');
    li.textContent = `${u.nome} (${u.email})`;
    li.innerHTML += ' <button class="btn-primary btn-delete-user" data-id="' + u.id + '">Excluir</button>';
    ul.appendChild(li);
  });
  document.querySelectorAll('.btn-delete-user').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Deseja realmente excluir este usuário? Todas as tarefas associadas serão removidas.')) {
        const delResp = await fetch(`${API_URL}/usuario/${id}`, { method: 'DELETE' });
        if (delResp.ok) {
          carregarUsuarios();
          carregarListaUsuarios();
        } else {
          alert('Erro ao excluir usuário.');
        }
      }
    };
  });
}

async function carregarTarefas() {
  const container = document.getElementById('tasks-container');
  container.innerHTML = '';
  const resp = await fetch(`${API_URL}/tarefas`);
  const data = await resp.json();
  data.tarefas.forEach(t => {
    const card = document.createElement('div');
    // Verifica se a tarefa está vencida
    const dataLimite = t.data_limite;
    const horarioLimite = t.horario_limite;
    const dataHoraLimite = new Date(`${dataLimite}T${horarioLimite}`);
    const agora = new Date();
    let vencida = false;
    if (!isNaN(dataHoraLimite.getTime()) && agora > dataHoraLimite) {
      vencida = true;
    }
    // Formata a data de vencimento para exibição
    let dataFormatada = dataLimite;
    if (dataLimite && dataLimite.includes('-')) {
      const [yyyy, mm, dd] = dataLimite.split('-');
      dataFormatada = `${dd}-${mm}-${yyyy}`;
    }
    // Define a cor de fundo do card de acordo com a prioridade e vencimento
    let cardClass = `task-card ${t.prioridade.toLowerCase()}`;
    if (vencida) {
      cardClass += ' vencida';
    }
    card.className = cardClass;
    card.innerHTML = `
      <h3>${t.titulo}</h3>
      <p>${t.descricao || ''}</p>
      <div><b>Prioridade:</b> ${t.prioridade}</div>
      <div><b>Entrega:</b> ${dataFormatada} ${t.horario_limite}</div>
      <div><b>Alerta:</b> ${t.minutos_antes_alerta} min antes</div>
      <div><b>Usuário:</b> ${t.usuario ? t.usuario.nome + ' (' + t.usuario.email + ')' : '-'}</div>
      <div class="task-card-buttons">
        <button class="btn-primary btn-edit-task" data-id="${t.id}">Editar</button>
        <button class="btn-primary btn-delete-task" data-id="${t.id}">Excluir</button>
      </div>
    `;
    container.appendChild(card);
  });
  // Adiciona evento de exclusão para cada botão já existente
  document.querySelectorAll('.btn-delete-task').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = btn.getAttribute('data-id');
      if (confirm('Deseja realmente excluir esta tarefa?')) {
        const resp = await fetch(`${API_URL}/tarefa/${id}`, { method: 'DELETE' });
        if (resp.ok) {
          // Recarrega a página após exclusão
          window.location.reload();
        } else {
          alert('Erro ao excluir tarefa.');
        }
      }
    });
  });
  // Adiciona evento de edição para cada botão
  document.querySelectorAll('.btn-edit-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const tarefa = data.tarefas.find(t => t.id == id);
      preencherFormEdicao(tarefa);
    });
  });
}

// Função para preencher o formulário com dados da tarefa para edição
function preencherFormEdicao(tarefa) {
  document.getElementById('titulo').value = tarefa.titulo;
  document.getElementById('descricao').value = tarefa.descricao || '';
  document.getElementById('prioridade').value = tarefa.prioridade;
  document.getElementById('data_limite').value = tarefa.data_limite;
  document.getElementById('horario_limite').value = tarefa.horario_limite.substring(0,5);
  document.getElementById('minutos_antes_alerta').value = tarefa.minutos_antes_alerta;
  document.getElementById('usuario_id').value = tarefa.usuario_id;
  form.setAttribute('data-edit-id', tarefa.id);
  document.querySelector('.form-section h2').textContent = 'Editar Tarefa';
  document.getElementById('btn-reset-form').style.display = 'inline-block';
  document.getElementById('btn-submit-task').textContent = 'Salvar Alterações';
}

// Função para resetar o formulário para modo criação
function resetForm() {
  form.reset();
  form.removeAttribute('data-edit-id');
  document.querySelector('.form-section h2').textContent = 'Criar Nova Tarefa';
  document.getElementById('btn-reset-form').style.display = 'none';
  document.getElementById('btn-submit-task').textContent = 'Salvar Tarefa';
}

// Altera o submit do form para criar ou editar
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const titulo = document.getElementById('titulo').value;
  const descricao = document.getElementById('descricao').value;
  const prioridade = document.getElementById('prioridade').value;
  const data_limite = document.getElementById('data_limite').value;
  const horario_limite_raw = document.getElementById('horario_limite').value;
  const horario_limite = horario_limite_raw.length === 5 ? horario_limite_raw + ':00' : horario_limite_raw;
  const minutos_antes_alerta = parseInt(document.getElementById('minutos_antes_alerta').value) || 0;
  const usuario_id = parseInt(document.getElementById('usuario_id').value);

  const tarefa = {
    titulo,
    descricao,
    prioridade,
    data_limite,
    horario_limite,
    minutos_antes_alerta,
    usuario_id
  };

  const editId = form.getAttribute('data-edit-id');
  if (editId) {
    // Editar tarefa existente
    const resp = await fetch(`${API_URL}/tarefa/${editId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tarefa)
    });
    if (resp.ok) {
      resetForm();
      carregarTarefas();
      alert('Tarefa atualizada!');
    } else {
      alert('Erro ao atualizar tarefa.');
    }
  } else {
    // Criar nova tarefa
    const resp = await fetch(`${API_URL}/tarefa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tarefa)
    });
    if (resp.ok) {
      form.reset();
      carregarTarefas();
      alert('Tarefa cadastrada!');
    } else {
      alert('Erro ao cadastrar tarefa.');
    }
  }
});

// Botão para resetar o formulário para modo criação
if (!document.getElementById('btn-reset-form')) {
  const btnReset = document.createElement('button');
  btnReset.type = 'button';
  btnReset.id = 'btn-reset-form';
  btnReset.className = 'btn-primary';
  btnReset.textContent = 'Voltar';
  btnReset.style.display = 'none';
  btnReset.style.marginLeft = '1em';
  btnReset.onclick = resetForm;
  document.getElementById('task-form').appendChild(btnReset);
}

// Permissão para notificações do navegador ao carregar a página
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Variável para controlar o piscar do título
let piscarInterval = null;
let tituloOriginal = document.title;

// Exibe alertas de tarefas próximas do vencimento
async function buscarAlertas() {
  const resp = await fetch(`${API_URL}/enviar_alertas`);
  const alertas = await resp.json();
  const alertsList = document.getElementById('alerts-list');
  alertsList.innerHTML = '';
  // Limpa piscar do título se não houver alertas
  if (!alertas.length) {
    alertsList.innerHTML = `
      <div style="text-align:center; color:#7b3fe4; font-size:1.2em; padding:1em 0;">
        <i class="bi bi-emoji-smile" style="font-size:2em;"></i><br/>
        Nenhuma atividade programada!
      </div>
    `;
    clearInterval(piscarInterval);
    document.title = tituloOriginal;
    return;
  }

  // Piscar o título da aba
  clearInterval(piscarInterval);
  let piscar = false;
  piscarInterval = setInterval(() => {
    document.title = piscar ? "⚠️ Tarefa próxima do vencimento!" : tituloOriginal;
    piscar = !piscar;
  }, 1000);

  // Notificação do navegador (apenas na primeira tarefa próxima)
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Tarefa próxima do vencimento!", {
      body: alertas[0].titulo + " - " + alertas[0].minutos_restantes + " min restantes.",
      icon: "https://cdn-icons-png.flaticon.com/512/1828/1828843.png"
    });
  }

  alertas.forEach(a => {
    const div = document.createElement('div');
    div.className = `alert-item ${a.prioridade.toLowerCase()}`;
    div.textContent = `${a.titulo} - Em ${a.minutos_restantes} minutos para ${a.usuario ? a.usuario.email : 'usuário'}`;
    alertsList.appendChild(div);
  });
}
