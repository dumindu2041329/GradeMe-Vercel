import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { Mail, MapPin, Phone, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactForm() {
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>();

  const onSubmit = (data: ContactFormData) => {
    // In a real application, we would send this data to a server
    console.log(data);
    
    // Show success message
    toast({
      title: "Message Sent",
      description: "Thanks for your message! We will get back to you soon.",
    });
    
    // Reset form
    reset();
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="lg:flex">
              <motion.div 
                className="lg:w-1/2 p-8 lg:p-12"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <motion.h2 
                  className="text-2xl font-bold text-gray-900 mb-6"
                  variants={fadeInUp}
                  custom={0}
                >
                  Send Us a Message
                </motion.h2>
                
                <form onSubmit={handleSubmit(onSubmit)}>
                  <motion.div 
                    className="space-y-6"
                    variants={staggerContainer}
                  >
                    <motion.div variants={fadeInUp} custom={1}>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        id="name" 
                        className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-primary focus:border-primary`} 
                        placeholder="John Doe" 
                        {...register("name", { required: "Name is required" })}
                      />
                      {errors.name && <p className="mt-1 text-red-500 text-sm">{errors.name.message}</p>}
                    </motion.div>
                    
                    <motion.div variants={fadeInUp} custom={2}>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input 
                        type="email" 
                        id="email" 
                        className={`w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-primary focus:border-primary`}
                        placeholder="john@example.com" 
                        {...register("email", { 
                          required: "Email is required",
                          pattern: {
                            value: /\S+@\S+\.\S+/,
                            message: "Please enter a valid email"
                          }
                        })}
                      />
                      {errors.email && <p className="mt-1 text-red-500 text-sm">{errors.email.message}</p>}
                    </motion.div>
                    
                    <motion.div variants={fadeInUp} custom={3}>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input 
                        type="text" 
                        id="subject" 
                        className={`w-full px-4 py-2 border ${errors.subject ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-primary focus:border-primary`}
                        placeholder="How can we help you?" 
                        {...register("subject", { required: "Subject is required" })}
                      />
                      {errors.subject && <p className="mt-1 text-red-500 text-sm">{errors.subject.message}</p>}
                    </motion.div>
                    
                    <motion.div variants={fadeInUp} custom={4}>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea 
                        id="message" 
                        rows={5} 
                        className={`w-full px-4 py-2 border ${errors.message ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-primary focus:border-primary`}
                        placeholder="Tell us more about your project, needs, and timeline..." 
                        {...register("message", { required: "Message is required" })}
                      ></textarea>
                      {errors.message && <p className="mt-1 text-red-500 text-sm">{errors.message.message}</p>}
                    </motion.div>
                    
                    <motion.div variants={fadeInUp} custom={5}>
                      <button 
                        type="submit" 
                        className="w-full bg-primary text-white font-medium py-3 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-300"
                      >
                        Send Message
                      </button>
                    </motion.div>
                  </motion.div>
                </form>
              </motion.div>
              
              <motion.div 
                className="lg:w-1/2 bg-gray-50 p-8 lg:p-12"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <motion.h3 
                  className="text-2xl font-bold text-gray-900 mb-6"
                  variants={fadeInUp}
                  custom={0}
                >
                  Contact Information
                </motion.h3>
                
                <motion.div 
                  className="space-y-8"
                  variants={staggerContainer}
                >
                  <motion.div className="flex items-start" variants={fadeInUp} custom={1}>
                    <MapPin className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">Office Location</h4>
                      <p className="mt-1 text-gray-600">
                        123 React Avenue<br />
                        San Francisco, CA 94107
                      </p>
                    </div>
                  </motion.div>
                  
                  <motion.div className="flex items-start" variants={fadeInUp} custom={2}>
                    <Mail className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">Email Us</h4>
                      <p className="mt-1 text-gray-600">
                        info@reactsite.com<br />
                        support@reactsite.com
                      </p>
                    </div>
                  </motion.div>
                  
                  <motion.div className="flex items-start" variants={fadeInUp} custom={3}>
                    <Phone className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">Call Us</h4>
                      <p className="mt-1 text-gray-600">
                        +1 (555) 123-4567<br />
                        +1 (555) 987-6543
                      </p>
                    </div>
                  </motion.div>
                  
                  <motion.div className="pt-6" variants={fadeInUp} custom={4}>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Follow Us</h4>
                    <div className="flex space-x-5">
                      <a href="#" className="text-gray-400 hover:text-primary transition-colors duration-300" aria-label="Twitter">
                        <Twitter className="h-6 w-6" />
                      </a>
                      <a href="#" className="text-gray-400 hover:text-primary transition-colors duration-300" aria-label="Facebook">
                        <Facebook className="h-6 w-6" />
                      </a>
                      <a href="#" className="text-gray-400 hover:text-primary transition-colors duration-300" aria-label="Instagram">
                        <Instagram className="h-6 w-6" />
                      </a>
                      <a href="#" className="text-gray-400 hover:text-primary transition-colors duration-300" aria-label="LinkedIn">
                        <Linkedin className="h-6 w-6" />
                      </a>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
