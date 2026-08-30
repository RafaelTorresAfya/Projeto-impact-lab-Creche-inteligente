import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-familia-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './familia-landing.component.html',
  styleUrl: './familia-landing.component.scss',
})
export class FamiliaLandingComponent {
  faq = [
    {
      pergunta: 'Quantas creches eu posso escolher?',
      resposta:
        'Até três, em ordem de preferência, entre as unidades que o sistema recomenda a partir dos seus endereços de referência. A criança ocupa uma única posição de fila — a preferência define para onde a vaga é oferecida primeiro, e não em quantas filas você entra.',
    },
    {
      pergunta: 'Posso escolher uma creche perto do meu trabalho, e não de casa?',
      resposta:
        'Pode. Na inscrição você informa até três endereços de referência — residência, trabalho, estudo, rede de apoio e escola de irmão — e dá a cada um um grau de prioridade diferente: alta, média e baixa.',
    },
    {
      pergunta: 'Preciso levar documentos na unidade para me inscrever?',
      resposta:
        'Não para se inscrever. CadÚnico e Bolsa Família são conferidos automaticamente. Os demais comprovantes entram por foto, com leitura automática — e só o que ficar duvidoso vai para conferência de um servidor.',
    },
    {
      pergunta: 'Recusei uma vaga. Perco a inscrição?',
      resposta:
        'Não. A criança mantém a pontuação e continua na fila das demais preferências. A vaga é oferecida imediatamente à próxima preferência não recusada.',
    },
  ];
}
