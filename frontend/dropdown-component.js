class CustomDropdown extends HTMLElement{
    static openDropdown = null;

    constructor(){
        super();
        this.attachShadow({mode:"open"});
        this.state={
            value: "",
            label: "",
            options: [],
        };
    }

    static get observedAttributes(){
        return ["value","placeholder"];
    }

    attributeChangedCallback(name, oldValue,newValue){
        if (oldValue!==newValue){
            if (name==="value"){
                this.setValue(newValue,false);
            } else if (name==="placeholder"&&this.triggerLabel){
                this.updateDisplay();
            }
        }
    }

    connectedCallback(){
        this.render();
        this.cacheElements();
        this.parseOptions();
        this.attachedEvents();

        const initialValue = this.getAttribute("value")||(this.state.options[0]?.value ??"");
        this.setValue(initialValue,false);
    }

    get value(){
        return this.state.value;
    }

    set value(val){
        this.setAttribute("value",val);
        this.setValue(val,true);
    }

    cacheElements(){
        const root = this.shadowRoot;
        this.wrapper = root.getElementById("wrapper");
        this.trigger = root.getElementById("trigger");
        this.triggerLabel = root.getElementById("trigger-label");
        this.optionsContainer = root.getElementById("options-container");
    }

    parseOptions(){
        const lightOptions = Array.from(this.querySelectorAll("option"));
        if (lightOptions.length>0){
            this.state.options = lightOptions.map((opt)=>({
                value: opt.value || opt.textContent.trim(),
                label: opt.textContent.trim(),
                disabled: opt.hasAttribute("disabled"),
            }));
        } else {
            try{
                const attrOptions = this.getAttribute("options");
                if (attrOptions){
                    this.state.options = JSON.parse(attrOptions);
                }
            } catch (e){
                this.state.options = [];
            }
        }
        this.renderOptions();
    }

    renderOptions(){
        this.optionsContainer.innerHTML = "";
        this.state.options.forEach((opt)=>{
            const item = document.createElement("button");
            item.type = "button";
            item.className = "dropdown-item";
            item.role = "option";
            item.dataset.value = opt.value;
            if (opt.disabled){
                item.disabled=true;
            }

            item.innerHTML=`
                <span>${opt.label}</span>
                <svg class="check-icon" viewBox = "0 0 24 24" width="16" height="16" fill="none" stroke = "currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"> 
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;

            item.addEventListener("click",()=>{
                if (!opt.disabled){
                    
                }
            })
        });
    }
}