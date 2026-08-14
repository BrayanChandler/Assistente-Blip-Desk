/*
  Objeto principal que agrupa todos os modelos de texto usados no protocolo.
  Ele funciona como uma biblioteca: guarda os textos de abertura e fechamento
  e também oferece funções para montar esses textos quando o atendente escolhe um motivo.
*/
const ModelosProtocolo = {

  /*
    Mapa de descrições por motivo de atendimento.
    Cada chave representa um modelo diferente de atendimento disponível para seleção.
    Dentro de cada motivo existem dois papéis:
    - abertura: texto inicial usado para registrar como o cliente entrou em contato.
    - fechamento: texto final, checklist ou resumo usado ao concluir o atendimento.
  */
  descricoesPorMotivo: {
    "PRESTAR INFORMAÇÕES / SAC": {
      abertura: "Cliente entrou em contato",
      fechamento: ``
    },
    "LENTIDÃO": {
      abertura: "Cliente entrou em contato informando estar com a conexão lenta",
      fechamento: `Modelo Roteador: 
Firmware:
Aparelhos conectados: 
Sinal de fibra: 
Consta histórico de desconexões: Não

Após os procedimentos realizados o cliente confirmou a normalização.`
    },
    "OFFLINE": {
      abertura: "Cliente entrou em contato informando sem internet",
      fechamento: `ROTEADOR/ ONT: 
ONU: 
Configurado: 
Sinal de Fibra: 
Status de leds: PON: Apagada; LOS: Ligada

PON Apagada. Falta de sinal na ONU`
    },
    "TROCA DE SENHA": {
      abertura: "O titular entrou em contato solicitando sua alteração de senha.",
      fechamento: `Nova Senha:
Novo SSID:
Roteador: 

Troca de senha realizada conforme solicitação.
Realizado confirmação de titularidade via dados: Data de Nascimento.
Cliente ciente das informações, também confirma acesso à rede com a nova senha.
Protocolo de atendimento finalizado.`
    },
    "ALTERAÇÃO PPPoE": {
      abertura: `Cliente entrou em contato solicitando alteração PPPoE.`,
      fechamento: `Realizado as alterações de autenticação. 
Atendimento realizado com sucesso. 
Protocolo finalizado.`
    },
    "MANUTENÇÃO EMERGENCIAL": {
      abertura: "Cliente entrou em contato informando dificuldade de acesso em sua conexão.",
      fechamento: `Verificado que na localidade do cliente ocorria manutenção corretiva.
Prazo de normalização do serviço de 4 horas a depender do caso.
Protocolo Concluído.`
    },
    "INSTABILIDADE": {
      abertura: "Cliente entrou em contato informando dificuldades na navegação.",
      fechamento: `Cliente foi informado sobre a instabilidade que ocorria no momento.
Prazo de normalização do serviço de 4 horas a depender do caso.
Ciente de que deverá manter os equipamentos ligados à tomada, para identificar quando sua conexão for normalizada.`
    },
    "SEGUNDA VIA DO BOLETO": {
      abertura: "Cliente entrou em contato solicitando a 2ª via do boleto.",
      fechamento: `Encaminhado ao e-mail: 
Ciente que após pagamento deve aguardar a compensação bancária. Sendo Via Pix de até 2h, via boleto 48 horas úteis para efetivação do pagamento em sistema e liberar sua conexão.
Ciente de que poderá realizar o desbloqueio por confiança pelo app ou Whatsapp no menu principal.
Atendimento Concluído.`
    },
    "INFORMAR PAGAMENTO": {
      abertura: "Cliente entrou em contato informando ter realizado o pagamento.",
      fechamento: `Ciente que após pagamento deve aguardar a compensação bancária. Sendo Via pix de até 2h, via boleto 48 horas úteis para efetivação do pagamento em sistema e liberar sua conexão.
Ciente de que poderá realizar o desbloqueio por confiança pelo Aplicativo da empresa, site da empresa ou Whatsapp no menu principal.
Atendimento Concluído.`
    },
    "UPGRADE": {
      abertura: `Cliente entrou em contato solicitando upgrade de seu plano`,
      fechamento: ``
    },
    "ALTERAÇÃO DE VENCIMENTO": {
      abertura: `Cliente solicita alterar a data de vencimento. Ciente de que não poderá realizar a troca com boleto vencido. Ciente de que a troca poderá ser gerado valor proporcional.
Cliente escolheu a data:
Encaminhado ao setor responsável para dar continuidade ao seu atendimento.`,
      fechamento: ``
    },
    "CONTAS A RECEBER": {
      abertura: `Cliente entrou em contato solicitando renegociação dos seus débitos.
Disponibilidade de receber contato:
Contatos atuais:`,
      fechamento: ``
    },
    "MUDANÇA DE TITULARIDADE": {
      abertura: `Cliente solicita Alteração de Titularidade.`,
      fechamento: ``
    },
    "REINSTALAÇÃO": {
      abertura: `Cliente entrou em contato solicitando troca de endereço/cômodo 
Novo endereço/cômodo:  
Disponibilidade de receber contato:
Contatos atuais: `,
      fechamento: ``
    },
    "APLICATIVO DA CENTRAL": {
      abertura: `Cliente entrou em contato solicitando senha de acesso ao aplicativo.`,
      fechamento: `Realizada a confirmação de titularidade: RG, CPF, data de nascimento e endereço.
Cadastrada a senha no sistema e informado ao cliente.
Após cadastrar senha e passar as orientações, o cliente confirmou o acesso ao aplicativo.
Protocolo de atendimento concluído.`
    },
    "ATENUAÇÃO DE FIBRA": {
      abertura: "Cliente entrou em contato informando problemas de conexão.",
      fechamento: `Roteador/ ONT: 
ONU:
Sinal de fibra:  
Com desconexões no extrato de conexão: Sim/Não

Visita para verificação de conector e drop com possível atenuação.`
    },
    "CANCELAMENTO": {
      abertura: `Cliente entrou em contato solicitando cancelamento do seu plano.
Disponibilidade de receber contato:
Contatos atuais:
MOTIVO DO CANCELAMENTO:
Informado ao cliente sobre o prazo de 48h para o setor responsável estar dando continuidade no atendimento.`,
      fechamento: ``
    }
  },

  /*
    Gera o texto de abertura do protocolo.
    Parâmetros recebidos:
    - nome: nome do cliente ou solicitante.
    - telefone: telefone relacionado ao atendimento.
    - ticket: número ou identificação do chamado/protocolo.
    - motivo: motivo escolhido pelo atendente para selecionar o modelo correto.
  */
  gerarAbertura: function(nome, telefone, ticket, motivo) {
    const m = this.descricoesPorMotivo[motivo];
    const texto = m ? m.abertura : "Atendimento registrado.";
    return `Cliente: ${nome}
Telefone: ${telefone}
Ticket: ${ticket}

${texto}`;
  },

  /*
    Gera o texto de fechamento do protocolo a partir do motivo selecionado.
    Quando não encontra um modelo para o motivo informado, retorna uma string vazia
    como fallback para não inserir nenhum fechamento indevido.
  */
  gerarFechamento: function(motivo) {
    const m = this.descricoesPorMotivo[motivo];
    return m ? m.fechamento : "";
  }
};
