import gsap from "gsap";

function tweenCSSVar(varName, el, duration, from, to) {
  const variable = {
    value: from
  };

  gsap.to(variable, {
    value: to,
    duration: duration,
    onUpdate: () => {
      el.style.setProperty(varName, variable.value);
    }
  });
}

export default tweenCSSVar;
