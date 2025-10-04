import { urlToHttpOptions } from "url";
import { getSystemErrorName } from "util";

export interface matchOpts{
	id: number,
    player1_id: number,
    player2_id: number,
    winner_id: number,
    score: string,
    date: string,
    gameName: string
}


export interface userObject{
    id: string,
    username: string,
    email: string,
    display_name: string
} 

export class MatchCard {
	private options: matchOpts;
    element: HTMLElement;

    private constructor(opt: matchOpts, element: HTMLElement){
        this.options = opt;
        this.element = element;
    }

async getName(id: string){
    const response = await fetch(`/api/auth/user/${id}`);
    if(response.status === 200){
        const user : userObject =await response.json();
        return user.display_name;
    }

    return `${id}`;
}

async populate(){
    // Game name e ID
    this.element.querySelector('.game-name-short')!.textContent = this.options.gameName;
    this.element.querySelector('.game-name')!.textContent = this.options.gameName;
    this.element.querySelector('.match-id')!.textContent = `#${this.options.id}`;
    
    // Players
    this.element.querySelector('.player1-id')!.textContent = await this.getName(this.options.player1_id.toString());
    this.element.querySelector('.player2-id')!.textContent = await this.getName(this.options.player2_id.toString());
    
    // Results
    this.element.querySelector('.score')!.textContent = this.options.score;
    this.element.querySelector('.winner-id')!.textContent = await this.getName(this.options.winner_id.toString());
    
    // Date
    const date = new Date(this.options.date);
    this.element.querySelector('.match-date')!.textContent = date.toLocaleDateString('it-IT');
}

    static async init(options: matchOpts): Promise<MatchCard>{
        const rawHtml = await fetch('/html/matchCard.html');
        const htmlString = await rawHtml.text();
        const wrapper = document.createElement('div');
        wrapper.innerHTML = htmlString;

        const card = new MatchCard(options, wrapper);
        await card.populate();
        return card;
    }
}

